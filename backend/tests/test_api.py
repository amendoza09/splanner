import asyncio
from datetime import datetime, time
from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException

import app as app_module
from app import MAX_EVENT_SPAN_DAYS, split_into_days
from models import Chore, Event, User

EVENT = {
    "title": "Dentist",
    "start_time": "2026-03-15T09:00:00",
    "end_time": "2026-03-15T10:00:00",
}


def make_group(client):
    return client.post("/group").json()["group_code"]


def make_member(client, code, name="Ana"):
    res = client.post(f"/group/{code}/members", json={"name": name, "color": "#f783a4"})
    assert res.status_code == 200
    return res.json()["user_id"]


def make_event(client, code, user_id, **overrides):
    res = client.post(
        f"/members/{user_id}/events",
        params={"group_code": code},
        json={**EVENT, **overrides},
    )
    assert res.status_code == 200
    return res.json()


def make_chore(client, code, user_id, title="Dishes"):
    res = client.post(f"/group/{code}/chores", json={"user_id": user_id, "title": title})
    assert res.status_code == 200
    return res.json()


def events_of(client, code, member_index=0):
    return client.get(f"/group/{code}").json()["users"][member_index]["events"]


# ── split_into_days ──────────────────────────────────────────────────────────


def test_single_day_event_keeps_its_times():
    start, end = datetime(2026, 3, 15, 9), datetime(2026, 3, 15, 10)
    assert split_into_days(start, end, False) == [(start, end)]


def test_overnight_event_is_cut_at_midnight():
    start, end = datetime(2026, 3, 15, 22), datetime(2026, 3, 16, 2)
    assert split_into_days(start, end, False) == [
        (start, datetime.combine(start.date(), time.max)),
        (datetime(2026, 3, 16), end),
    ]


def test_middle_days_of_an_event_span_the_whole_day():
    days = split_into_days(datetime(2026, 3, 15, 22), datetime(2026, 3, 17, 2), False)
    assert days[1] == (datetime(2026, 3, 16), datetime.combine(datetime(2026, 3, 16).date(), time.max))


def test_task_fills_each_whole_day():
    days = split_into_days(datetime(2026, 3, 15, 9), datetime(2026, 3, 16, 10), True)
    assert days == [
        (datetime(2026, 3, 15), datetime.combine(datetime(2026, 3, 15).date(), time.max)),
        (datetime(2026, 3, 16), datetime.combine(datetime(2026, 3, 16).date(), time.max)),
    ]


def test_month_and_year_boundaries():
    days = split_into_days(datetime(2026, 12, 31, 12), datetime(2027, 1, 1, 12), False)
    assert [start.date().isoformat() for start, _ in days] == ["2026-12-31", "2027-01-01"]


def test_longest_allowed_span_is_accepted():
    start = datetime(2026, 1, 1)
    end = datetime(2027, 1, 2)
    assert (end - start).days == MAX_EVENT_SPAN_DAYS
    assert len(split_into_days(start, end, False)) == MAX_EVENT_SPAN_DAYS + 1


def test_span_over_the_limit_is_rejected():
    with pytest.raises(HTTPException) as err:
        split_into_days(datetime(2026, 1, 1), datetime(2027, 1, 3), False)
    assert err.value.status_code == 400


# ── Groups ───────────────────────────────────────────────────────────────────


def test_new_group_gets_a_joinable_five_character_code(client):
    code = make_group(client)
    assert len(code) == 5
    assert code == code.upper() and code.isalnum()
    res = client.get(f"/group/{code}")
    assert res.status_code == 200
    assert res.json()["users"] == []


def test_unknown_group_is_a_404(client):
    # The frontend relies on this exact status to log a device out.
    assert client.get("/group/NOPE1").status_code == 404


def test_group_returns_members_with_their_events(client):
    code = make_group(client)
    user_id = make_member(client, code)
    make_event(client, code, user_id, notes="Bring forms")
    [member] = client.get(f"/group/{code}").json()["users"]
    assert member["user_id"] == user_id
    assert member["name"] == "Ana"
    [event] = member["events"]
    assert event["title"] == "Dentist"
    assert event["notes"] == "Bring forms"
    assert event["is_task"] is False


def test_regenerating_replaces_the_code_and_keeps_the_data(client):
    old = make_group(client)
    make_member(client, old)
    new = client.post(f"/group/{old}/regenerate-code").json()["group_code"]
    assert new != old
    assert client.get(f"/group/{old}").status_code == 404
    assert len(client.get(f"/group/{new}").json()["users"]) == 1


def test_old_code_stops_working_after_regenerating(client):
    old = make_group(client)
    user_id = make_member(client, old)
    client.post(f"/group/{old}/regenerate-code")
    res = client.post(f"/members/{user_id}/events", params={"group_code": old}, json=EVENT)
    assert res.status_code == 403


def test_regenerating_never_broadcasts_the_new_code(client, broadcasts):
    old = make_group(client)
    client.post(f"/group/{old}/regenerate-code")
    assert broadcasts == [(old, "group_code_changed", {})]


def test_deleting_a_group_removes_everything_and_tells_devices(client, db, broadcasts):
    code = make_group(client)
    user_id = make_member(client, code)
    make_event(client, code, user_id)
    make_chore(client, code, user_id)

    assert client.delete(f"/group/{code}").status_code == 200

    assert client.get(f"/group/{code}").status_code == 404
    assert db.query(User).count() == 0
    assert db.query(Event).count() == 0
    assert db.query(Chore).count() == 0
    assert broadcasts[-1] == (code, "group_deleted", {})


def test_deleting_a_group_leaves_other_groups_alone(client):
    doomed, kept = make_group(client), make_group(client)
    user_id = make_member(client, kept)
    make_event(client, kept, user_id)
    client.delete(f"/group/{doomed}")
    assert len(events_of(client, kept)) == 1


# ── Access control ───────────────────────────────────────────────────────────


@pytest.mark.parametrize(
    "method, path, body",
    [
        ("post", "/members/{user_id}/events", EVENT),
        ("patch", "/members/{user_id}/events/{event_id}", {"title": "Hacked"}),
        ("delete", "/members/{user_id}/events/{event_id}", None),
        ("delete", "/members/{user_id}", None),
        ("patch", "/chores/{chore_id}", {"completed": True}),
        ("delete", "/chores/{chore_id}", None),
    ],
)
def test_another_groups_code_cannot_change_data(client, method, path, body):
    code, other_code = make_group(client), make_group(client)
    user_id = make_member(client, code)
    event_id = make_event(client, code, user_id)[0]["event_id"]
    chore_id = make_chore(client, code, user_id)["chore_id"]
    group_before = client.get(f"/group/{code}").json()
    chores_before = client.get(f"/group/{code}/chores").json()

    url = path.format(user_id=user_id, event_id=event_id, chore_id=chore_id)
    res = client.request(method, url, params={"group_code": other_code}, json=body)

    assert res.status_code == 403
    assert client.get(f"/group/{code}").json() == group_before
    assert client.get(f"/group/{code}/chores").json() == chores_before


def test_event_routes_require_a_group_code(client):
    code = make_group(client)
    user_id = make_member(client, code)
    assert client.post(f"/members/{user_id}/events", json=EVENT).status_code == 422


def test_cannot_edit_a_member_through_another_group(client):
    code, other_code = make_group(client), make_group(client)
    user_id = make_member(client, code)
    res = client.patch(f"/group/{other_code}/members/{user_id}", json={"name": "Hacked"})
    assert res.status_code == 404
    assert client.get(f"/group/{code}").json()["users"][0]["name"] == "Ana"


def test_cannot_assign_a_chore_to_another_groups_member(client):
    code, other_code = make_group(client), make_group(client)
    user_id = make_member(client, code)
    res = client.post(f"/group/{other_code}/chores", json={"user_id": user_id, "title": "Dishes"})
    assert res.status_code == 404


def test_cannot_move_an_event_to_another_groups_member(client):
    code, other_code = make_group(client), make_group(client)
    user_id = make_member(client, code)
    outsider = make_member(client, other_code, "Sam")
    event_id = make_event(client, code, user_id)[0]["event_id"]
    res = client.patch(
        f"/members/{user_id}/events/{event_id}",
        params={"group_code": code},
        json={"user_id": outsider},
    )
    assert res.status_code == 400
    assert len(events_of(client, code)) == 1
    assert events_of(client, other_code) == []


def test_cannot_delete_another_members_event_through_the_wrong_member(client):
    code = make_group(client)
    ana, sam = make_member(client, code), make_member(client, code, "Sam")
    event_id = make_event(client, code, ana)[0]["event_id"]
    res = client.delete(f"/members/{sam}/events/{event_id}", params={"group_code": code})
    assert res.status_code == 404
    assert len(events_of(client, code)) == 1


def run_join(session_factory, monkeypatch, group_code):
    enter_room = AsyncMock()
    monkeypatch.setattr(app_module, "SessionLocal", session_factory)
    monkeypatch.setattr(app_module.sio, "enter_room", enter_room)
    asyncio.run(app_module.join_group("sid-1", {"group_code": group_code}))
    return enter_room


def test_socket_can_join_a_real_group(client, session_factory, monkeypatch):
    code = make_group(client)
    enter_room = run_join(session_factory, monkeypatch, code)
    enter_room.assert_awaited_once_with("sid-1", code)


def test_socket_cannot_join_a_room_for_an_unknown_code(client, session_factory, monkeypatch):
    enter_room = run_join(session_factory, monkeypatch, "NOPE1")
    enter_room.assert_not_awaited()


# ── Events ───────────────────────────────────────────────────────────────────


def test_adding_an_event_saves_it_and_syncs_devices(client, broadcasts):
    code = make_group(client)
    user_id = make_member(client, code)
    broadcasts.clear()
    make_event(client, code, user_id)
    [event] = events_of(client, code)
    assert event["start_time"] == EVENT["start_time"]
    assert event["end_time"] == EVENT["end_time"]
    assert broadcasts == [(code, "refresh", {"reason": "event-added"})]


def test_multi_day_task_is_stored_once_per_day(client):
    code = make_group(client)
    user_id = make_member(client, code)
    created = make_event(
        client,
        code,
        user_id,
        is_task=True,
        start_time="2026-03-15T00:00:00",
        end_time="2026-03-17T23:59:59",
    )
    assert len(created) == 3
    assert [e["start_time"][:10] for e in events_of(client, code)] == [
        "2026-03-15",
        "2026-03-16",
        "2026-03-17",
    ]


@pytest.mark.parametrize("missing", ["start_time", "end_time"])
def test_event_without_times_is_rejected_cleanly(client, missing):
    code = make_group(client)
    user_id = make_member(client, code)
    body = {k: v for k, v in EVENT.items() if k != missing}
    res = client.post(f"/members/{user_id}/events", params={"group_code": code}, json=body)
    assert res.status_code == 422


def test_overlong_title_is_rejected(client):
    code = make_group(client)
    user_id = make_member(client, code)
    res = client.post(
        f"/members/{user_id}/events",
        params={"group_code": code},
        json={**EVENT, "title": "x" * 201},
    )
    assert res.status_code == 422


def test_partial_event_update_keeps_the_other_fields(client):
    code = make_group(client)
    user_id = make_member(client, code)
    event_id = make_event(client, code, user_id, notes="Bring forms")[0]["event_id"]
    res = client.patch(
        f"/members/{user_id}/events/{event_id}",
        params={"group_code": code},
        json={"title": "Doctor"},
    )
    assert res.status_code == 200
    [event] = events_of(client, code)
    assert event["title"] == "Doctor"
    assert event["notes"] == "Bring forms"
    assert event["start_time"] == EVENT["start_time"]


def test_event_can_move_to_another_member_of_the_group(client):
    code = make_group(client)
    ana, sam = make_member(client, code), make_member(client, code, "Sam")
    event_id = make_event(client, code, ana)[0]["event_id"]
    client.patch(
        f"/members/{ana}/events/{event_id}",
        params={"group_code": code},
        json={"user_id": sam},
    )
    assert events_of(client, code, 0) == []
    assert len(events_of(client, code, 1)) == 1


def test_editing_an_event_past_midnight_splits_it_by_day(client):
    code = make_group(client)
    user_id = make_member(client, code)
    event_id = make_event(client, code, user_id)[0]["event_id"]
    client.patch(
        f"/members/{user_id}/events/{event_id}",
        params={"group_code": code},
        json={"start_time": "2026-03-15T22:00:00", "end_time": "2026-03-16T02:00:00"},
    )
    events = sorted(events_of(client, code), key=lambda e: e["start_time"])
    assert [e["start_time"] for e in events] == ["2026-03-15T22:00:00", "2026-03-16T00:00:00"]
    assert events[1]["end_time"] == "2026-03-16T02:00:00"
    assert events[0]["event_id"] == event_id


def test_deleting_an_event_removes_only_that_event(client, broadcasts):
    code = make_group(client)
    user_id = make_member(client, code)
    first = make_event(client, code, user_id)[0]["event_id"]
    make_event(client, code, user_id, title="Gym")
    broadcasts.clear()
    res = client.delete(f"/members/{user_id}/events/{first}", params={"group_code": code})
    assert res.status_code == 200
    assert [e["title"] for e in events_of(client, code)] == ["Gym"]
    assert broadcasts == [(code, "refresh", {"reason": "event-deleted"})]


# ── Members ──────────────────────────────────────────────────────────────────


def test_blank_member_name_is_rejected(client):
    code = make_group(client)
    res = client.post(f"/group/{code}/members", json={"name": "", "color": "#fff"})
    assert res.status_code == 422


def test_updating_a_member_changes_only_what_was_sent(client):
    code = make_group(client)
    user_id = make_member(client, code)
    client.patch(f"/group/{code}/members/{user_id}", json={"name": "Anna"})
    [member] = client.get(f"/group/{code}").json()["users"]
    assert member["name"] == "Anna"
    assert member["color"] == "#f783a4"


def test_removing_a_member_removes_only_their_events_and_chores(client, db, broadcasts):
    code = make_group(client)
    ana, sam = make_member(client, code), make_member(client, code, "Sam")
    make_event(client, code, ana)
    make_chore(client, code, ana)
    make_event(client, code, sam, title="Gym")
    make_chore(client, code, sam, title="Trash")
    broadcasts.clear()

    res = client.delete(f"/members/{ana}", params={"group_code": code})

    assert res.status_code == 200
    assert [e.title for e in db.query(Event).all()] == ["Gym"]
    assert [c.title for c in db.query(Chore).all()] == ["Trash"]
    assert broadcasts == [(code, "refresh", {"reason": "member-deleted"})]


# ── Chores ───────────────────────────────────────────────────────────────────


def test_chore_can_be_added_completed_and_deleted(client, broadcasts):
    code = make_group(client)
    user_id = make_member(client, code)
    broadcasts.clear()

    chore = make_chore(client, code, user_id)
    assert chore["completed"] is False

    params = {"group_code": code}
    client.patch(f"/chores/{chore['chore_id']}", params=params, json={"completed": True})
    assert client.get(f"/group/{code}/chores").json()[0]["completed"] is True

    client.patch(f"/chores/{chore['chore_id']}", params=params, json={"completed": False})
    assert client.get(f"/group/{code}/chores").json()[0]["completed"] is False

    client.delete(f"/chores/{chore['chore_id']}", params=params)
    assert client.get(f"/group/{code}/chores").json() == []

    assert [reason["reason"] for _, _, reason in broadcasts] == [
        "chore-added",
        "chore-toggled",
        "chore-toggled",
        "chore-deleted",
    ]


def test_chore_list_only_shows_this_groups_chores(client):
    code, other_code = make_group(client), make_group(client)
    make_chore(client, code, make_member(client, code), title="Mine")
    make_chore(client, other_code, make_member(client, other_code), title="Theirs")
    assert [c["title"] for c in client.get(f"/group/{code}/chores").json()] == ["Mine"]
