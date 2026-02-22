# FPL Dashboard - Build Plan

## Completed Features

- [x] User authentication (register, login, logout)
- [x] Forgot/reset password flow (via Resend email)
- [x] Guest mode for viewing teams
- [x] Team dashboard with player data
- [x] Live gameweek page

## Planned Features

### High Priority (Quick wins)
- [ ] Captain pick analysis - show if captain choice was optimal vs other options
- [ ] Bench vs Starting XI stats - show points left on bench each week
- [ ] Fixture difficulty meter - visual indicator of upcoming opponent strength
- [ ] Player form chart - points trend over last 5-10 gameweeks

### Medium Priority
- [ ] Head-to-head comparisons - view league members' squads side-by-side
- [ ] Chip usage strategy - recommend best gameweek for Wildcard/Free Hit/BB
- [ ] Transfer ROI tracker - show cumulative points gained/lost from transfers
- [ ] Price change predictions - track player price rise/fall likelihood

### Future Ideas
- [ ] Push notifications for price changes, lineup announcements
- [ ] Season comparison - compare current vs previous season performance
- [ ] Custom alerts (player injury, team news)
- [ ] Export stats to image for sharing

## Known Bugs

- [x] Live fixtures on production don't update
- [x] `/leagues?team=` showing all 0s instead of live scores
- [x] `/live?team=` only showing user's live score, not other league members

## UI Updates

- [ ] Mobile: No button to access login/logout/create account
- [ ] Mobile: The UI is gray, don't want that it might only be grey when the user has it in day mode 
- [ ] `/live` page: Show if team made transfers that week and what they were
- [ ] `/live` page: Show if transfers were beneficial (points gained/lost)
- [ ] `/live` page: Show chips used (3x captain, bench boost, etc.) or if still available
- [ ] Move "League Ownership / Differentials" section to its own tab called "Differential"

## Notes

- Resend free tier only sends to registered email. Verify domain for production.
