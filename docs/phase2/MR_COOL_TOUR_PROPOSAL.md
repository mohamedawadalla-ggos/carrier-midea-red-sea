# Mr. Cool — First-Visit Guided Tour (content proposal, pending approval)

## Trigger & persistence
- First-time visitor (no `mr_cool_tour_seen` flag in `localStorage`) sees Mr.
  Cool "wave" from the floating avatar a couple of seconds after page load,
  then a small "Show me around?" prompt bubble with Yes/Skip.
- If Yes: sequential speech bubbles walk through the stops below, each with
  Next / Skip tour.
- If Skip (or tour finishes): set the flag, never auto-plays again.
- A small "؟" / tour-replay affordance stays available near the floating
  avatar for anyone who wants to replay it manually later.
- Fully skippable at any point; Escape and clicking outside close it same as
  the advisor dialog.

## Tour stops (anchored to real sections already on the homepage)

1. **Greeting** (anchored to the floating avatar itself)
   - AR: "أهلاً! أنا مستر كول 👋 حابب أوريك الموقع في دقيقة واحدة؟"
   - EN: "Hi! I'm Mr. Cool 👋 Want a 60-second tour of the site?"

2. **`#best-selling-products`** — HP picker + live prices
   - AR: "من هنا تختار تكييفك على حسب القدرة بالحصان، وتشوف السعر الحالي فورًا."
   - EN: "Pick your AC by horsepower here, and see the current price right away."

3. **`#featured-products-title`** — catalog families
   - AR: "وده الكتالوج الكامل لكل عائلات كاريير وميديا لو حابب تستكشف أكتر."
   - EN: "This is the full catalog of Carrier and Midea families if you want to browse more."

4. **`#services`** — end-to-end service
   - AR: "إحنا مش بس بنبيع تكييفات — بنركّب ونصون ونصلح كمان."
   - EN: "We don't just sell ACs — we install, maintain, and repair them too."

5. **`#coverage`** — service coverage map
   - AR: "دي مناطق التغطية بتاعتنا على ساحل البحر الأحمر وخليج السويس."
   - EN: "Here's our service coverage along the Red Sea and Gulf of Suez coast."

6. **`#contact`** — WhatsApp request form (closing stop)
   - AR: "لو محتاج أي حاجة، ابعتلنا من هنا وهيتواصل معاك فريقنا فورًا. جاهز؟"
   - EN: "Need anything? Send us a message here and our team will reach out.
     Ready to explore?"

## What I need from you before building
1. Approve/edit the copy above (Arabic phrasing especially — I drafted it,
   not a native marketing writer).
2. Confirm the trigger logic (first-visit only, replay affordance) matches
   what you pictured.
3. Anything to add/remove from the stop list?
