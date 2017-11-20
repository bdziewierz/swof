# Support Wheel Of Fate API

At one of our companies, all engineers take it in turns to support the business for half a day at a time.
This is affectionately known as BAU. Currently, there is no tool which decides who is doing BAU and when,
all rotas are created and maintained by hand.

This API selects two engineers at random to both complete a half day of support each.
For the purposes of this system, we assume that we have 10 engineers. For simplicity we also assume
7 days work week (no free weekends).

# Business Rules
There are some rules and these are liable to change in the future:
* An engineer can do at most one half day shift in a day.
* An engineer cannot have half day shifts on consecutive days.
* Each engineer should have completed one whole day of support in any 2 week period.
