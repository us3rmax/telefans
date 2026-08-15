# Deployment notes

- Repository: https://github.com/us3rmax/telefans
- Vercel project: `telefans` (`prj_rnKrtUA7wi334MQMn9xRdXZakBCx`)
- Team: `vendassbk7-2445s-projects` (`team_eZJQ9dcAtQJyIwwWCpVKpWQh`)
- Main domain: https://telefans-pi.vercel.app/
- READY deployment for commit `b88db807fe49c20c18bc384680b0c13d85f539fb`: https://telefans-ar8gj48b6-vendassbk7-2445s-projects.vercel.app/
- The READY deployment served `/app/models`; the main alias returned 404 for that new route during verification, while existing public creator routes remained accessible. The alternate project alias `https://telefans-vendassbk7-2445s-projects.vercel.app/` served the new admin route.
- Commits published during this phase: `b88db80` (isolated models management), `4afa26c` (creator draft form), `8bba2d5` (content and reels queues).

The latest READY deployment for commit `8bba2d5` is https://telefans-idwzwfu69-vendassbk7-2445s-projects.vercel.app/. Its `/app/content` route renders the seeded posts and publication controls, and `/app/reels` renders the Alex Mucci video in the “Na fila” queue with pause and profile controls. The main and older aliases were not yet serving these new routes during verification.

After reusing the existing GitHub-linked Vercel project with `create_git_project`, deployment `dpl_6oijMrQBerMVxJZTfKN6kMSPCy8r` reached READY. The branch alias https://telefans-git-main-vendassbk7-2445s-projects.vercel.app/app/content now serves the new Content route successfully. The custom `telefans-pi.vercel.app` alias still needs a final propagation check.

The public `/reels` route on `telefans-pi.vercel.app` now includes the seeded Alex Mucci video before the existing reels and exposes like, comment, share, and creator-profile controls. Opening the comment action displays the comments sheet with an input and submit action.
