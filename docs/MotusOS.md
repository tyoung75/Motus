# MotusOS - Single Source of Truth

> **Last Updated:** February 7, 2026
> **Version:** 1.0.0

This document serves as the definitive knowledge base for all aspects of the MOTUS product and business. All changes to the product should be reflected here.

---

## Table of Contents

1. [Product Overview](#product-overview)
2. [User Onboarding Flow](#user-onboarding-flow)
3. [Programs](#programs)
4. [Nutrition & Macros](#nutrition--macros)
5. [Food Logging](#food-logging)
6. [Sharing & Referrals](#sharing--referrals)
7. [Technical Architecture](#technical-architecture)
8. [Third-Party Integrations](#third-party-integrations)
9. [Business Model](#business-model)
10. [Changelog](#changelog)

---

## Product Overview

### Mission
MOTUS helps athletes train with intent through structured programming, calibrated nutrition, and intelligent progression.

### Core Value Proposition
- **Periodized Training**: Mesocycle-based programming with base, build, peak, and taper phases
- **Precision Nutrition**: Macros calibrated to training load and body composition goals
- **Progressive Overload**: Systematic volume and intensity progression with strategic deloads
- **Data-Driven**: Volume load trends, strength curve analysis, and training density metrics

### Target Users
1. Serious recreational athletes
2. Competitive endurance athletes (runners, cyclists, triathletes)
3. Strength sport athletes (powerlifters, Olympic lifters)
4. Physique-focused individuals (bodybuilders, general fitness)

---

## User Onboarding Flow

### Overview
The onboarding flow is designed to be progressive, collecting only the information needed for each program type.

### Flow Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: Account Creation                                       │
│  - Name                                                         │
│  - Email                                                        │
│  - Phone (optional)                                             │
│  - Agree to Terms & Privacy                                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: Program Selection (Detailed Overview)                  │
│  Choose one of:                                                 │
│  - 🔥 30 Day Lock In (Minimal steps, share-to-unlock)          │
│  - 🏃 Endurance (Running, Cycling, Swimming, Triathlon)        │
│  - 🏋️ Strength (Powerlifting, Olympic, Strongman)              │
│  - 💪 Aesthetic (Hypertrophy, Lean Muscle, Recomp)             │
│                                                                 │
│  [Hybrid programs available for Endurance only]                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
          ┌───────────────────┴───────────────────┐
          ↓                                       ↓
┌─────────────────────┐               ┌─────────────────────────────┐
│  30 Day Lock In     │               │  Standard Programs          │
│  (Minimal Flow)     │               │  (Full Flow)                │
│                     │               │                             │
│  - Sex              │               │  - Sex                      │
│  - Weight           │               │  - Body Metrics             │
│  - Height           │               │  - Age                      │
│  - Activity Level   │               │  - Training History         │
│  - Commitments      │               │  - Goal Details             │
│  - Share x3 Friends │               │  - Nutrition Preferences    │
│                     │               │  - Payment                  │
└─────────────────────┘               └─────────────────────────────┘
```

### Step Details

#### Step 1: Account Creation
| Field | Required | Notes |
|-------|----------|-------|
| Name | Yes | First name only acceptable |
| Email | Yes | Used for account recovery and notifications |
| Phone | No | For future SMS features |
| Terms Agreement | Yes | Must agree to Terms & Privacy Policy |

#### Step 2: Program Selection
Each program card shows:
- Icon and title
- Brief description
- What to expect
- Time commitment
- Hybrid availability (Endurance only)

### 30 Day Lock In - Minimal Flow
**Goal:** Get users started in under 2 minutes

**Data Collected:**
| Field | Purpose | Required |
|-------|---------|----------|
| Sex | BMR calculation | Yes |
| Weight | BMR/TDEE calculation | Yes |
| Height | BMR calculation | Yes |
| Activity Level | TDEE multiplier | Yes |
| Daily Commitments | Program structure | Yes (defaults provided) |

**Unlock Method:** Share with 3 friends (no payment required)

### Standard Programs - Full Flow
**Steps:**
1. Basic Info (Sex only - name already collected)
2. Body Metrics (Weight, Height, Age, Body Fat %)
3. Training History
4. Program-specific Goal Details
5. Nutrition Preferences
6. Payment

---

## Programs

### 30 Day Lock In 🔥

**Purpose:** Build momentum with a simple, structured 30-day challenge

**Structure:**
- Duration: 30 days
- Days 1-6: Weightlifting (double progressive overload) + optional cardio
- Day 7: Active recovery (1 hour)
- Cardio: 3x/week, 20-30 minutes

**Daily Commitments:**
| Commitment | Required | Default | Options |
|------------|----------|---------|---------|
| 1hr Workout | Yes | Checked | N/A |
| Daily Steps | Yes | 10k | 10k, 15k |
| 1 Gallon Water | No | Checked | On/Off |
| High Protein | No | Checked | On/Off |

**Cardio Options:** Treadmill, Stair Master, Elliptical, Cycling

**Rest Day Activities:** 1hr Jog, 1hr Walk, Cycling Class, Yoga, Stretching

**Workout Structure:**
- Double progressive overload (increase reps, then weight)
- Full body or Push/Pull/Legs split based on preference
- Light cardio on 3 lifting days

**Unlock Method:** Share with 3 friends via DM/Text (no payment)

---

### Endurance Programs 🏃

**Subtypes:**
| Subtype | Description | Key Features |
|---------|-------------|--------------|
| Running | Race training (5K to Ultra) | Pace-based zones, mileage progression, taper |
| Cycling | Road/MTB training | Power zones, TSS tracking |
| Swimming | Pool/Open water | Stroke efficiency, distance progression |
| Triathlon | Multi-sport | Swim/Bike/Run periodization, brick workouts |

**Hybrid Option:** Can add Strength or Aesthetic as secondary goal

**Data Required:**
- Race distance and date
- Current fitness level (recent race times, weekly mileage)
- Training days per week

---

### Strength Programs 🏋️

**Subtypes:**
| Subtype | Description | Key Features |
|---------|-------------|--------------|
| Powerlifting | SBD focus | Competition peaking, attempt selection |
| Olympic Lifting | Snatch & C&J | Technical periodization |
| Strongman | Event training | Implements, conditioning |

**Data Required:**
- Current 1RMs (Big 4 lifts)
- Target 1RMs
- Goal date
- Training days per week

**Hybrid Option:** Not available (strength is primary focus)

---

### Aesthetic Programs 💪

**Subtypes:**
| Subtype | Description | Key Features |
|---------|-------------|--------------|
| Hypertrophy | Max muscle growth | High volume, progressive overload |
| Lean Muscle | Build while staying lean | Moderate surplus, body recomp |
| Recomp | Lose fat, gain muscle | Maintenance calories, high protein |

**Data Required:**
- Current body fat % (optional but recommended)
- Target body fat %
- Training days per week

**Hybrid Option:** Not available (aesthetic focus requires dedicated training)

---

## Nutrition & Macros

### BMR Calculation

**Primary Formula:** Mifflin-St Jeor (most accurate for general population)

```
Men:    BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age) + 5
Women:  BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age) - 161
```

**Alternative Formulas (used when additional data available):**
- Katch-McArdle: When body fat % is known
  ```
  BMR = 370 + (21.6 × Lean Body Mass in kg)
  ```
- Direct RMR: When user has RMR test results

### TDEE Calculation

**Activity Multipliers:**
| Level | Description | Multiplier |
|-------|-------------|------------|
| Sedentary | Little to no exercise | 1.2 |
| Light | Light exercise 1-3 days/week | 1.375 |
| Moderate | Moderate exercise 3-5 days/week | 1.55 |
| Active | Hard exercise 6-7 days/week | 1.725 |
| Very Active | Very hard exercise, physical job | 1.9 |

**Training Day Adjustment:**
- Add workout calories burned (estimated from session type/duration)
- Endurance: Use HR-based or pace-based calorie estimates
- Strength: ~5-8 cal/min for resistance training

### Macro Distribution

**By Goal:**
| Goal | Protein | Carbs | Fat |
|------|---------|-------|-----|
| Fat Loss | 1.0-1.2g/lb | 0.8-1.0g/lb | Remainder |
| Maintenance | 0.8-1.0g/lb | 1.0-1.5g/lb | Remainder |
| Muscle Gain | 0.8-1.0g/lb | 1.5-2.0g/lb | Remainder |
| Endurance | 0.7-0.9g/lb | 2.0-3.0g/lb | Remainder |
| 30 Day Lock In | 1.0g/lb ideal BW | Flexible | Flexible |

### Advanced Body Metrics (Optional)

**DEXA Scan Data:**
- Body fat %
- Lean mass
- Bone mineral density
- Regional fat distribution

**InBody Scan Data:**
- Body fat %
- Skeletal muscle mass
- Body water %
- Segmental lean analysis

**RMR Test Data:**
- Measured resting metabolic rate
- Respiratory quotient (fat vs carb oxidation)

**Usage:** When available, these replace estimated values for more accurate calculations.

---

## Food Logging

### Logging Methods (Priority Order)

#### 1. Photo Analysis (Default - NEW)
**Flow:**
1. User takes/uploads photo of meal
2. Add optional context (e.g., "non-fat Greek yogurt with blueberries")
3. AI analyzes photo to identify foods and estimate portions
4. Pre-populate macro estimates
5. User reviews/adjusts if needed
6. Log meal

**AI Analysis:**
- Food identification
- Portion size estimation
- Macro/calorie estimation
- Confidence score display

#### 2. Barcode Scan
**Flow:**
1. Scan product barcode
2. Fetch nutrition data from database
3. Adjust serving size
4. Log meal

**Database:** Open Food Facts + custom additions

#### 3. Manual Search
**Flow:**
1. Search food database
2. Select matching item
3. Adjust serving size
4. Log meal

### Meal Types
- Breakfast
- Lunch
- Dinner
- Snack
- Pre-workout
- Post-workout

### Quick Fill from Meal Plan
When a meal plan exists, users can one-tap log the planned meal with pre-filled macros.

---

## Sharing & Referrals

### Share-to-Unlock (30 Day Lock In)

**Requirement:** Share with 3 friends to unlock program

**Supported Platforms:**
| Platform | Method | API |
|----------|--------|-----|
| Instagram DM | Deep link | Meta Send API |
| Facebook Messenger | Deep link | Meta Send API |
| WhatsApp | Deep link | WhatsApp API |
| iMessage/SMS | Native share | iOS Share Sheet |
| TikTok Story | Story post | TikTok Share Kit |

### Share Messages

**30 Day Lock In:**
```
I just signed up for the 30 Day Lock In challenge. Join me: [URL]
```

**Standard Programs:**
```
I'm doing [Program Type] training with MOTUS. Join me: [URL]
```

**Hybrid Programs:**
```
I'm doing [Primary] + [Secondary] hybrid training with MOTUS. Join me: [URL]
```

### Referral Tracking
- Unique referral codes per user
- Track conversions
- Reward system (TBD)

### Meta API Integration

**Send API (for DMs):**
- Requires Facebook/Instagram business account
- User must have connected accounts
- Deep link with pre-filled message

**Share Kit (for Stories):**
- Native share to Instagram/Facebook Stories
- Custom sticker/overlay with MOTUS branding
- Link sticker to app

### TikTok Integration

**Share Kit:**
- Post to TikTok with pre-set content
- Link in bio integration
- Hashtag suggestions (#30DayLockIn, #MOTUS)

---

## Technical Architecture

### Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | React + Vite |
| Styling | Tailwind CSS |
| Backend | Supabase (Auth, Database, Storage) |
| Payments | Stripe |
| Hosting | Vercel |

### Database Schema (Supabase)

**Tables:**
- `profiles` - User profile data
- `programs` - Generated workout programs
- `meals` - Logged meals
- `workouts` - Logged workouts
- `subscriptions` - Payment/subscription status
- `referrals` - Referral tracking

### Authentication

**Methods:**
- Email/Password (primary)
- Phone OTP (pending Twilio setup)
- Google OAuth (configured)
- Apple Sign-In (requires Apple Dev account)

### State Management
- React Context for auth and subscription
- localStorage for offline persistence
- Supabase real-time sync when online

---

## Third-Party Integrations

### Fitness Platforms

| Platform | Status | Data Sync |
|----------|--------|-----------|
| Strava | Planned | Activities, HR, pace |
| Garmin | Planned | Activities, sleep, HR, stress |
| Apple Health | Planned | Workouts, steps, HR |
| Google Fit | Planned | Activities, HR |

### Payment
- **Stripe** - Subscription management, one-time payments

### Food Database
- **Open Food Facts** - Barcode lookup
- **USDA FoodData** - Nutrition data
- **Custom additions** - User-submitted foods

### AI/ML
- **OpenAI Vision API** - Photo food analysis (planned)
- **Claude API** - Meal plan generation, coaching

### Social/Sharing
- **Meta APIs** - Instagram/Facebook sharing
- **TikTok Share Kit** - Story posting
- **Native Share** - iOS/Android share sheets

---

## Business Model

### Pricing Tiers

| Tier | Price | Features |
|------|-------|----------|
| 30 Day Lock In | Free (share to unlock) | 30-day program, basic tracking |
| Monthly | $19.99/month | Full access, all programs |
| Annual | $149.99/year | Full access, priority support |

### Revenue Streams
1. Subscriptions (primary)
2. Affiliate partnerships (Instacart, supplement brands)
3. Premium coaching add-ons (future)

### Metrics to Track
- Monthly Active Users (MAU)
- Conversion rate (free → paid)
- Churn rate
- LTV (Lifetime Value)
- Referral conversion rate

---

## Changelog

### Version 1.0.0 (February 7, 2026)
- Initial MotusOS document created
- Documented all current product features
- Established onboarding flow structure
- Defined program types and requirements
- Specified nutrition calculation methods
- Outlined sharing/referral system
- Listed technical architecture

### Pending Changes
- [ ] Reorder onboarding to show program selection after account creation
- [ ] Implement photo-based food logging
- [ ] Add advanced body metrics modal
- [ ] Integrate Meta/TikTok sharing APIs
- [ ] Implement share-to-unlock for 30 Day Lock In

---

## Quick Reference

### BMR Formula (Mifflin-St Jeor)
```
Men:    (10 × kg) + (6.25 × cm) - (5 × age) + 5
Women:  (10 × kg) + (6.25 × cm) - (5 × age) - 161
```

### Protein Targets
- Fat Loss: 1.0-1.2g per lb bodyweight
- Maintenance: 0.8-1.0g per lb bodyweight
- Muscle Gain: 0.8-1.0g per lb bodyweight
- 30 Day Lock In: 1.0g per lb ideal bodyweight

### Program Durations
- 30 Day Lock In: 30 days
- Race Training: Varies by race date
- Strength Block: 8-16 weeks
- Hypertrophy Block: 8-12 weeks

---

*This document is maintained as the Single Source of Truth for MOTUS. All product decisions and implementations should reference and update this document.*
