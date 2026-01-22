[33mcommit 6a30c3e915790b4dbaa96aeac5d1abf8a6b661dc[m[33m ([m[1;36mHEAD[m[33m -> [m[1;32mmain[m[33m, [m[1;31morigin/main[m[33m)[m
Author: popfoxi <cc9673738@gmail.com>
Date:   Thu Jan 22 21:21:13 2026 +0800

    Fix usage limits, support modal, and analytics logic

 app/actions.ts            |   58 [32m+[m[31m-[m
 app/admin/actions.ts      |   38 [32m+[m[31m-[m
 app/admin/page.tsx        |  128 [32m+[m[31m-[m
 app/api/analyze/route.ts  |  218 [32m+[m[31m-[m
 app/page.tsx              |  466 [32m+++[m[31m-[m
 lib/constants.ts          |   11 [32m+[m
 lib/credits.ts            |   27 [32m+[m
 lib/gtag.ts               |    9 [32m+[m
 lib/modules.ts            |  240 [32m++[m
 package-lock.json         | 5956 [32m+++++++++++++++++++++++++++++++++++[m[31m----------[m
 package.json              |    3 [32m+[m[31m-[m
 prisma/schema.prisma      |    8 [32m+[m[31m-[m
 scripts/clear-analyses.ts |   33 [32m+[m
 13 files changed, 5685 insertions(+), 1510 deletions(-)

[33mcommit 36b9d446430c82a36b8bf96812ea7dddd8f170f8[m
Author: popfoxi <cc9673738@gmail.com>
Date:   Thu Jan 22 19:58:35 2026 +0800

    feat: Enhance admin analytics with 30-day trend and usage segmentation

 app/admin/actions.ts     |  51 [32m+++++[m[31m--[m
 app/admin/page.tsx       | 353 [32m++++++++++++++++++++++++++++++++++++++++++[m[31m-----[m
 app/api/analyze/route.ts |   1 [32m+[m
 prisma/schema.prisma     |   2 [32m+[m
 4 files changed, 361 insertions(+), 46 deletions(-)

[33mcommit 5c0cf528285989475a16efd769abb43cc93f820c[m
Author: popfoxi <cc9673738@gmail.com>
Date:   Thu Jan 22 19:34:09 2026 +0800

    Fix: Redesign admin system settings UI to be more compact

 app/admin/page.tsx | 114 [32m++++++++++++++++++++++++++[m[31m---------------------------[m
 1 file changed, 57 insertions(+), 57 deletions(-)
