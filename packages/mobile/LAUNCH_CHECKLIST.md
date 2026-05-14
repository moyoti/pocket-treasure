# Google Play Launch Checklist - Treasure Cat

## 📋 Complete Launch Checklist

### Phase 1: Pre-Submission Preparation

#### ✅ App Assets
- [x] **App Name**: Treasure Cat (寻宝猫)
- [x] **Icon**: 512x512px cat mascot ✅ Created
- [ ] **Feature Graphic**: 1024x500px - TODO
- [ ] **Screenshots**: Minimum 2, recommended 5-8 - TODO
- [ ] **Promo Video**: 30s-2min (optional) - TODO

#### ✅ Store Listing Content
- [x] **Short Description**: "Collect treasures, explore maps, and trade with friends offline!"
- [x] **Full Description**: Complete English and Japanese versions
- [ ] **Translations**: Review and finalize
- [x] **Category**: Adventure (Primary), Casual (Secondary)
- [x] **Tags**: Adventure, Collection, Offline, Location-based, Social

#### ✅ Legal & Compliance
- [x] **Privacy Policy**: Template created - TODO: Host online
- [ ] **Privacy Policy URL**: Need to host (GitHub Pages recommended)
- [ ] **Terms of Service**: Optional but recommended
- [ ] **Content Rating**: Complete questionnaire in Play Console

#### ✅ Technical Preparation
- [x] **App Name Updated**: Treasure Cat ✅
- [x] **Package Name**: com.treasurecat.app ✅
- [ ] **Release Build**: Create Android App Bundle (.aab)
- [ ] **App Signing**: Set up Play App Signing
- [ ] **Testing**: Test on multiple devices

---

### Phase 2: Google Play Console Setup

#### 1. Create Developer Account
- [ ] **Sign Up**: https://play.google.com/console
- [ ] **Pay Fee**: $25 USD one-time
- [ ] **Verify Identity**: Provide required documents
- [ ] **Complete Profile**: Developer name, contact info

**Required Information:**
- Developer name (individual or company)
- Email address
- Phone number
- Mailing address

#### 2. Create New App
- [ ] Click "Create App"
- [ ] Enter app name: "Treasure Cat"
- [ ] Select language: English (United States)
- [ ] Choose app or game: **Game**
- [ ] Free or paid: **Free**

#### 3. Store Listing
- [ ] **App Name**: Treasure Cat
- [ ] **Short Description**: 80 characters max
- [ ] **Full Description**: Complete text
- [ ] **App Icon**: Upload 512x512px
- [ ] **Feature Graphic**: Upload 1024x500px
- [ ] **Screenshots**: Upload minimum 2 phone screenshots
- [ ] **Video**: Add YouTube URL (optional)

#### 4. Content Rating
- [ ] Complete questionnaire
- [ ] Answer all questions honestly
- [ ] Expected rating: **Everyone (E)**
- [ ] Submit for rating

#### 5. App Content
- [ ] **Privacy Policy**: Add URL
- [ ] **Ads Declaration**: No ads
- [ ] **App Access**: No restrictions
- [ ] **Target Audience**: All ages
- [ ] **News App**: No
- [ ] **COVID-19**: Not applicable

#### 6. Data Safety
- [ ] Complete data safety section
- [ ] Declare data collection (location)
- [ ] Declare data sharing (none)
- [ ] Security practices
- [ ] Privacy policy URL

#### 7. Pricing & Distribution
- [ ] **Price**: Free
- [ ] **Countries**: All countries (or select)
- [ ] **Age Restriction**: None
- [ ] **Google Play for Education**: Not applicable

---

### Phase 3: Build & Upload

#### Create Release Build
```bash
cd packages/mobile

# Clean build
yarn android:clean

# Create release AAB
yarn android:release

# Output location:
# android/app/build/outputs/bundle/release/app-release.aab
```

#### Upload to Play Console
- [ ] Go to "Production" track
- [ ] Click "Create new release"
- [ ] Upload .aab file
- [ ] Add release notes:
  ```
  Welcome to Treasure Cat! 🐱

  Features:
  - Explore the real world and collect treasures
  - Trade with nearby players offline
  - Create custom markers
  - Complete collections and achievements
  - No internet required for core gameplay

  Start your treasure hunting adventure today!
  ```
- [ ] Check for errors/warnings
- [ ] Save

#### Release Rollout
- [ ] Select "Staged rollout"
- [ ] Start with 10% of users
- [ ] Monitor for 2-3 days
- [ ] Check crash reports
- [ ] If stable, increase to 20%, then 50%, then 100%

---

### Phase 4: Pre-Launch Testing

#### Internal Testing Track
- [ ] Create internal test track
- [ ] Upload build
- [ ] Add testers (email addresses)
- [ ] Get feedback
- [ ] Fix critical issues

#### Closed Testing Track
- [ ] Create closed test track
- [ ] Invite beta testers (10-50 people)
- [ ] Collect feedback
- [ ] Iterate on app

#### Open Testing Track (Optional)
- [ ] Create open test track
- [ ] Public beta access
- [ ] Gather wider feedback
- [ ] Final polish

---

### Phase 5: Launch

#### Launch Day Checklist
- [ ] Final review of all store listing elements
- [ ] Confirm privacy policy is live
- [ ] Submit app for review
- [ ] Monitor review status (typically 2-7 days)
- [ ] Respond to any review feedback
- [ ] Once approved, start staged rollout

#### Monitor Launch
- [ ] **Crash-free rate**: Target >99%
- [ ] **ANR rate**: Target <0.5%
- [ ] **User ratings**: Monitor and respond
- [ ] **Reviews**: Respond to user feedback
- [ ] **Installs**: Track initial adoption

---

### Phase 6: Post-Launch

#### Week 1:
- [ ] Monitor crash reports daily
- [ ] Respond to all reviews (especially negative ones)
- [ ] Track key metrics (retention, session length)
- [ ] Address critical bugs immediately

#### Week 2-4:
- [ ] Analyze user feedback
- [ ] Plan first update
- [ ] Optimize ASO based on performance
- [ ] Consider marketing activities

#### Ongoing:
- [ ] Regular updates (monthly recommended)
- [ ] Add new features
- [ ] Fix bugs
- [ ] Engage with community
- [ ] Monitor competitors

---

## 📊 Key Metrics to Track

### Google Play Console Metrics:

#### Acquisition:
- **Store listing visitors**
- **Installs**
- **Conversion rate** (visitors → installs)

#### Quality:
- **Crash-free users** (target: >99%)
- **ANR rate** (target: <0.5%)
- **Battery usage**
- **App size**

#### Engagement:
- **Daily Active Users (DAU)**
- **Monthly Active Users (MAU)**
- **Session length**
- **Retention** (Day 1, Day 7, Day 30)

#### Monetization (if applicable):
- **Revenue**
- **Average revenue per user (ARPU)**
- **Paying users percentage**

---

## 🚨 Common Issues & Solutions

### Issue: App Rejected
**Common Reasons:**
- Privacy policy missing or inadequate
- Misleading description
- Copyright infringement
- Policy violations

**Solution:**
- Review rejection email carefully
- Fix the specific issues
- Resubmit with explanation

### Issue: Poor Conversion Rate
**Possible Causes:**
- Weak screenshots
- Unclear value proposition
- Poor reviews
- High price (if paid)

**Solution:**
- A/B test screenshots
- Improve description
- Encourage positive reviews
- Optimize store listing

### Issue: Low Retention
**Possible Causes:**
- App crashes
- Poor onboarding
- Lack of content
- Confusing UI

**Solution:**
- Fix crashes immediately
- Improve first-time user experience
- Add more content/features
- Simplify UI

---

## 📞 Support Resources

### Google Play Resources:
- **Play Console Help**: https://support.google.com/googleplay/android-developer
- **Policy Center**: https://play.google.com/console/u/0/developer/policy-center
- **Developer Community**: https://support.google.com/googleplay/thread

### Tools:
- **Play Console**: App management
- **Firebase**: Analytics and crash reporting
- **Google Analytics**: User behavior
- **AppFollow/Review tools**: Review management

---

## 🎯 Success Metrics

### First Month Goals:
- [ ] 1,000+ installs
- [ ] 4.0+ star rating
- [ ] >99% crash-free rate
- [ ] 100+ reviews

### First Quarter Goals:
- [ ] 10,000+ installs
- [ ] Maintain 4.0+ rating
- [ ] Regular updates (monthly)
- [ ] Build community

---

## ✅ Final Pre-Launch Checklist

### Must Have Before Submission:
- [x] App name and icon
- [x] Privacy policy hosted online
- [x] At least 2 screenshots
- [x] Complete store listing text
- [x] Signed release build (.aab)
- [ ] Google Play Developer account ($25)
- [ ] Content rating questionnaire completed
- [ ] Data safety section completed

### Nice to Have:
- [ ] 5-8 high-quality screenshots
- [ ] Feature graphic
- [ ] Promo video
- [ ] Japanese translation
- [ ] Press kit
- [ ] Social media presence

---

## 🎉 Launch Timeline Summary

**Week 1-2:**
- Prepare all assets
- Create developer account
- Build release version

**Week 3:**
- Upload to Play Console
- Complete all sections
- Submit for review

**Week 4:**
- App approved
- Start staged rollout
- Monitor metrics
- Respond to reviews

**Ongoing:**
- Regular updates
- Community engagement
- ASO optimization
- Feature additions

---

**Good luck with your Treasure Cat launch! 🐱💎🗺️**

Remember: Launch is just the beginning. Success comes from continuous improvement and engagement with your users!
