# Seed Firestore with Initial Players

## Manual Steps (Firebase Console)

1. Go to: https://console.firebase.google.com/project/islanderscricketclub/firestore

2. Create Collection: `players`

3. Add Documents (one for each player):

**Player 1:**
```
Document ID: (auto-generate)
name: "Akhil Reddy Danda"
fullName: "Akhil Reddy Danda"
email: "your-email@gmail.com"  
age: 25
battingStyle: "Right-hand bat"
bowlingStyle: "Right-arm"
roleType: "All-Rounder"
equipmentReceived:
  practiceTShirt:
    received: false
    size: null
    date: null
  matchTShirt:
    received: false
    size: null
    date: null
  cap:
    received: false
    size: null
    date: null
isActive: true
createdAt: (timestamp - current)
updatedAt: (timestamp - current)
```

Repeat for remaining 11 players from the list below.

## Player List (12 players):
1. Akhil Reddy Danda - Captain, All-Rounder
2. Faizan Mohammad - Vice Captain, All-Rounder
3. Nitish - Associate VC, All-Rounder
4. Dinesh Reddy - Quality Director, All-Rounder
5. Charan - All-Rounder
6. Sampath Reddy - WK-Batsman
7. Harshith - Quality Director, All-Rounder
8. Karthikeya - All-Rounder
9. Pushkar - All-Rounder
10. Farhan - All-Rounder
11. Pardha - All-Rounder
12. Shaswath - Bowler

All players start with equipment `received: false`

## Team Equipment Inventory

Create Collection: `teamEquipment`
Document ID: `inventory`

```
practiceTShirts:
  XS: 2
  S: 5
  M: 7
  L: 8
  XL: 3
  XXL: 1
matchTShirts:
  XS: 2
  S: 5
  M: 7
  L: 8
  XL: 3
  XXL: 1
caps:
  S: 4
  M: 8
  L: 6
lastUpdated: (timestamp - current)
updatedBy: "admin"
```

After adding players, create your user as admin in `users` collection.
