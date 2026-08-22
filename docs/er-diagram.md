# GlobeTrotter - Entity Relationship Diagram & Data Dictionary

Below is the complete database model for the **GlobeTrotter** multi-city travel planning platform.

## Mermaid ER Diagram

```mermaid
erDiagram
    USER ||--o{ TRIP : "creates (onDelete: Cascade)"
    TRIP ||--|{ STOP : "contains (onDelete: Cascade)"
    CITY ||--o{ STOP : "visited in (onDelete: Restrict)"
    CITY ||--o{ ACTIVITY : "offers (onDelete: Cascade)"
    STOP ||--o{ STOP_ACTIVITY : "schedules (onDelete: Cascade)"
    ACTIVITY ||--o{ STOP_ACTIVITY : "linked to (onDelete: Cascade)"
    TRIP ||--|| BUDGET : "allocates (onDelete: Cascade)"

    USER {
        string id PK "uuid"
        string firstName
        string lastName
        string email UK "unique"
        string passwordHash
        string phoneNumber "optional"
        string city "optional"
        string country "optional"
        string additionalInfo "optional"
        string profilePhotoUrl "optional"
        Role role "enum: USER, ADMIN"
        datetime createdAt
    }

    TRIP {
        string id PK "uuid"
        string userId FK "index"
        string name
        string description "optional"
        string coverPhotoUrl "optional"
        datetime startDate "optional"
        datetime endDate "optional"
        boolean isPublic "default: false"
        datetime createdAt
        datetime updatedAt
    }

    CITY {
        string id PK "uuid"
        string name
        string country
        int costIndex "1 to 5"
        int popularity "1 to 100"
        string imageUrl "optional"
    }

    STOP {
        string id PK "uuid"
        string tripId FK "index"
        string cityId FK "index"
        datetime startDate "optional"
        datetime endDate "optional"
        int orderIndex "order in itinerary"
    }

    ACTIVITY {
        string id PK "uuid"
        string cityId FK "index"
        string name
        string description "optional"
        ActivityCategory category "enum"
        decimal cost "10,2"
        float durationHours
        string imageUrl "optional"
    }

    STOP_ACTIVITY {
        string id PK "uuid"
        string stopId FK "index"
        string activityId FK "index"
        datetime scheduledDate "optional"
        string scheduledTime "optional"
    }

    BUDGET {
        string id PK "uuid"
        string tripId FK, UK "one-to-one"
        decimal transportCost "10,2"
        decimal stayCost "10,2"
        decimal activitiesCost "10,2"
        decimal mealsCost "10,2"
    }
```

---

## Data Dictionary & Relationships Summary

### Enums
- **`Role`**: `USER`, `ADMIN`
- **`ActivityCategory`**: `SIGHTSEEING`, `FOOD`, `ADVENTURE`, `CULTURE`, `RELAXATION`, `OTHER`

### Model Indexes & Foreign Keys
1. **`User`**: Primary key `id`. Unique constraint on `email`.
2. **`Trip`**: Index on `userId`. Foreign key to `User(id)` with `onDelete: Cascade`.
3. **`City`**: Primary key `id`. Unique composite constraint on `(name, country)`.
4. **`Stop`**: Indexes on `tripId` and `cityId`. Foreign keys to `Trip(id)` (`onDelete: Cascade`) and `City(id)` (`onDelete: Restrict`).
5. **`Activity`**: Index on `cityId`. Foreign key to `City(id)` with `onDelete: Cascade`.
6. **`StopActivity`**: Indexes on `stopId` and `activityId`. Foreign keys to `Stop(id)` (`onDelete: Cascade`) and `Activity(id)` (`onDelete: Cascade`).
7. **`Budget`**: One-to-one unique foreign key to `Trip(id)` with `onDelete: Cascade`.
