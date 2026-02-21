I want to create an web app for travel planning
The app will have few components:
1. places and their details stored in db. same for users.
    a users will have login id as email/phone/both
    b. places must have metadata: id, name, country, type (history/fun),fee, google map url, timing, notes
2. user can create their trips
3. Trip object will have few parts:
    a. daywise itinerary
    b. notes secion
    c. documents section having links to document
4. Trip object can be edited from web UI
5. Trip object should be editable to ONLY the members. not anyone else.
5. there will be a admin role for the entire system who can
    a. add place details
    b. update notes about a place
6. The app will be hosted on github

Components:
1. DB: mongodb
    a. conn string : mongodb+srv://andrewMitra:Anten3bhhp$@travelplannerbasicclust.82jeaae.mongodb.net/?appName=TravelPlannerBasicCluster
2. front end : react/fluentui
3. backend : nodejs