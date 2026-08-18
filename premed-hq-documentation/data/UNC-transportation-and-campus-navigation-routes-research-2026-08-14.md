# UNC transportation and campus navigation: live-route boundaries

**Research date:** 2026-08-14 (America/New_York)  
**Scope:** Official UNC and Town of Chapel Hill transportation owners. This is wayfinding, not a safety guarantee, accessibility determination, or live-trip planner.

## Decision in one screen

Atlas can identify the correct official route for transit, campus shuttles, parking, accessibility, biking/walking, and event travel. It must hand the student to the owner’s **live** schedule, map, alert, reservation, or permit page before they rely on a trip. Route numbers, hours, stops, detours, wait times, fares, permit availability, and evening services change.

| Situation | Official owner route | Safe action | Do not infer |
|---|---|---|---|
| Need a local bus trip | [Chapel Hill Transit](https://www.townofchapelhill.org/government/departments-services/transit) | Check the current route map, schedule, service alert, and trip-planning information. | That a bus is running now, will arrive on time, or serves a particular address. |
| Need UNC commuter/parking guidance | [Move UNC](https://move.unc.edu/) | Use current UNC transportation/parking instructions; check permit/lot rules live. | That a permit, lot, or event parking space is available. |
| Need evening/on-demand campus transport | [Point-to-Point](https://move.unc.edu/parking/point-to-point/) | Read the current owner eligibility, operating area, and request instructions. | Hours, pickup certainty, safety outcome, or that it replaces emergency services. |
| Have a mobility/access transportation barrier | Official transit accessibility route and [UNC accommodations](https://compliance.unc.edu/) where relevant | Contact the appropriate owner and confirm the current individualized process. | That a specific vehicle/accommodation or timing will be provided. |
| Bike/walk/scooter on or near campus | [Move UNC](https://move.unc.edu/) and Town/UNC live maps | Check the current route, parking, and regulation information. | That a route is safe, open, well-lit, or usable under current weather/construction. |
| Need an airport/intercity trip | Official transportation owner or carrier’s live page | Plan from the live service schedule and booking rules. | A fixed travel time, fare, luggage policy, or connection. |
| Immediate safety emergency | **911** or UNC Police **919-962-8100** | Seek emergency help first. | That a shuttle/ride service is an emergency response. |

## Public transit and UNC transportation are different owners

Chapel Hill Transit is the owner for its local fixed-route and accessible-transit information; UNC transportation owns campus-specific parking, commuter, and Point-to-Point information. A student route can involve both, but Atlas should not merge their rules or copy an old schedule into one static campus map. [Chapel Hill Transit](https://www.townofchapelhill.org/government/departments-services/transit) · [Move UNC](https://move.unc.edu/)

The Town identifies the fixed-route system as fare-free, but fare policies and special/event services can differ and are subject to current owner rules. Display current fare/eligibility only from the live route owner; never apply a historic fare-free statement to a special service. [Town transit policy context](https://townhall.townofchapelhill.org/agendas/ca050627/6c-attach2-fees_transportation.htm)

## Point-to-Point and safety

Point-to-Point is a transportation service route, not an emergency or personal-safety guarantee. Atlas can say: **“Check Point-to-Point’s current hours, boundary, and request method; in an emergency, call 911 or UNC Police.”** It must not promise a pickup, recommend it as the only response to danger, or quote operating hours without live verification. [Point-to-Point](https://move.unc.edu/parking/point-to-point/)

## Parking and event travel

Parking is rule- and capacity-dependent. A public lot description, a historic permit rule, or an event listing does not establish that a student may park there today. For every parking suggestion, Atlas should route to Move UNC’s current permit/lot/event information and make the user verify:

- eligible permit or visitor method;
- time/date restrictions;
- event restrictions;
- lot/space availability; and
- the walk/transit leg after parking.

Never turn a parking link into a “best place to park” claim unless the owner has published that exact designation for the current event.

## Product rules

1. **Live owner page over cached schedule.** Atlas may save a durable owner route, not a timetable or stop list.
2. **No runtime representation of a trip as confirmed.** A route card says “Check live schedule,” not “You can get there by 8:15.”
3. **Separate access from outcome.** An accessible-transit/accommodation route establishes whom to contact, not a guaranteed accommodation or ride.
4. **Weather, construction, and events are high-staleness conditions.** Require live alert review immediately before travel.
5. **Safety language must be bounded.** Transit availability does not establish that someone is safe; emergency concerns go to emergency services.
6. **Do not retain precise mobility/medical needs in corpus data.** At most, retain a user-selected routing preference locally and privately.

## Minimal data contract

```text
TransportRoute
  owner: Chapel_Hill_Transit | Move_UNC | Point_to_Point | accommodations
  source_url
  source_checked_at
  mode: bus | shuttle | parking | bike_walk | accessibility | intercity
  current_check_required: true
  claims_not_supported: [arrival_time, availability, safety_outcome, permit_eligibility]
```

## Source register and refresh rules

1. [Chapel Hill Transit](https://www.townofchapelhill.org/government/departments-services/transit) — current routes, schedules, notices, and accessibility owner. Recheck at trip time.
2. [Move UNC](https://move.unc.edu/) — current UNC campus transportation/parking owner. Recheck per permit cycle, event, and travel day.
3. [Point-to-Point](https://move.unc.edu/parking/point-to-point/) — current service-specific rules and request method. Recheck immediately before relying on it.
4. [University Compliance accommodations](https://compliance.unc.edu/) — current individualized accommodation route; do not turn it into a service guarantee.

## Evidence limits

- This packet provides no live schedule, route, fare, parking, arrival-time, weather, or accessibility claim.
- It does not establish an individual’s eligibility for transportation support or a parking permit.
- Historic municipal documents are only context; current owner pages control present operations.
