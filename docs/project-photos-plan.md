# Project photos

> **Hosting (updated 2026-10-01):** the site will be hosted on **Vercel** (planned; it currently
> runs on localhost). **Content and photos stay in Sanity.** Any server / VPS deploy notes
> elsewhere in the repo are outdated. To add photos: Sanity Studio, or `npm run photos:upload`
> (dry run, then `--apply`) — see "Adding project photos" in README.md. `npm run check-photos`
> lists what is still missing. Deploy checklist: docs/vercel-deploy.md.

**Sanity is the only home of the project photos** (owner, 2026-09-25). Nothing is copied into the
repo. `npm run photos:upload` optimizes each photo (max 2000px long side, WebP, EXIF/GPS removed)
into `C:\dev\project-photos-optimized\` — outside the repo — and uploads it to its project in Sanity.

## Upload dry run (2026-09-25) — waiting for the owner's approval

Nothing below has been uploaded yet. The rules (scripts/project-photos.mjs):
- Images already in Sanity are never removed or reordered; new ones are added after them.
- Duplicates are skipped: the same file, or the same picture (a visual hash — the owner's own
  Studio uploads for #1–#7 and #184 are all recognised).
- Main photo: set where there is none. On the 34 pages, the photo shown until now is replaced by
  the folder's hero and moved to the end of the gallery (unless the folder already has it). A main
  photo chosen in the Studio is kept.
- Alt text "<project name>, <location>". Written to the published documents — nothing in drafts.

```
projects to change : 164
photos to upload   : 1179
already in Sanity  : 38 (skipped)
skipped projects   : 0
list rows without a folder (21): #192, #191, #190, #189, #188, #186, #185, #183, #182, #178, #177, #171, #170, #160, #159, #143, #127, #126, #123, #110, #106
```

| # | Project slug | Folder | Photos in folder | Already in Sanity | Main photo | Gallery: now → after | Before: +N | Note |
|---|---|---|---|---|---|---|---|---|
| 187 | fab-u-salon-piru-vihar-sadar-bazar-delhi-cantt | 185. Fab U Salon Piru Vihar Delhi Cantt Delhi | 18 |  | set (first file, no hero.jpg) | 0 → 17 |  |  |
| 184 | bellance-nail-art-zora-mall-raipur-chhasttisgarh | 184 Bellance Nail Art Zora Mall Raipur Chhattisgarh | 6 | 4 | keep (same photo) | 4 → 5 |  |  |
| 181 | geetanjali-salon-gurugram (page) | 181. Geetanjali Salon Felix Plaza Sector 82 Gurugram | 7 |  | replace | 0 → 7 |  | old main photo moved to the end of the gallery |
| 180 | hakim-ali-salon (page) | 180. Hakim Ali Salon High Street Apollo Indore M.P | 4 |  | replace | 0 → 4 |  | old main photo moved to the end of the gallery |
| 179 | geetanjali-salon-guwahati-assam | 179. Geetanjali Salon City Center Mall Guwahati Assam | 6 |  | set | 0 → 5 |  |  |
| 176 | peluqueria-salon-lucknow (page) | 176. Peluqueria Salon Emaar Gomti Green Lucknow U.P | 9 |  | keep (same photo) | 0 → 8 |  |  |
| 175 | aloevera-salon-noida (page) | 175. Aloevera Salon Central 50 Mall Sector 50 Noida U.P | 6 |  | replace | 0 → 6 |  | old main photo moved to the end of the gallery |
| 174 | tony-and-guy-salon-central-market-sector-120-noida-u-p | 174. Toni & Guy Salon Central Market Sector 120 Noida U.P | 6 |  | set | 0 → 5 |  |  |
| 173 | toni-and-guy (page) | 173. Toni & Guy Salon Indirapuram Habitat Centre Ghaziabad U.P | 7 |  | replace | 0 → 7 |  | old main photo moved to the end of the gallery |
| 172 | madonna-salon (page) | 172. Madonna Salon Greenfield Colony Sector 43 Faridabad Haryana | 5 |  | replace | 0 → 5 |  | old main photo moved to the end of the gallery |
| 169 | bellissima-unisex-salon (page) | 169. Bellissima Unisex Salon by Jyoti Sector 7 Dwarka New Delhi | 4 |  | keep (same photo) | 0 → 3 |  |  |
| 168 | looks-salon-gulshan-one29-noida-u-p | 168. Looks Salon Gulshan One29 Noida U.P | 6 |  | set | 0 → 5 |  |  |
| 167 | eesha-salon (page) | 167. Eesha Salon AIPL Joy Street Sector 66 Gurugram | 7 |  | replace | 0 → 7 |  | old main photo moved to the end of the gallery |
| 166 | geetanjali-studio-ajmer (page) | 166. Geetanjali Studio Anasagar Circular Road Ajmer Rajasthanj | 7 |  | replace | 0 → 7 |  | old main photo moved to the end of the gallery |
| 165 | dopulence-salon (page) | 165. Dopulence Salon Kankarbagh Patna Bihar | 7 | 1 | replace | 0 → 5 |  |  |
| 164 | geetanjali-salon-jharkhand (page) | 164. Geetanjali Salon Jhamshedpur Jharkhand | 5 |  | keep (same photo) | 0 → 4 |  |  |
| 163 | geetanjali-salon-vensejmall (page) | 163. Geetanjali Studio Vensej Mall Sector 57 Gurgaon | 7 |  | keep (same photo) | 0 → 6 |  |  |
| 162 | geetanjali-salon-elan-miracle-sector-84-gurgaon | 162. Geetanjali Salon Elan Miracle Sector 84 Gurgaon | 9 |  | set | 0 → 8 |  |  |
| 161 | geetanjali-salon-vasant-vihar (page) | 161. Geetanjali Salon Vasant Vihar Priya Market New Delhi | 9 |  | keep (same photo) | 0 → 8 |  |  |
| 158 | geetanjali-salon-ireo (page) | 158. Geetanjali Salon IREO The Grand View High Street Sector 58 Gurgaon | 10 |  | replace | 0 → 10 |  | old main photo moved to the end of the gallery |
| 157 | geetanjali-academy-dehradun (page) | 157. Geetanjali Academy Prabhat Takij Chakrata Road Dehradun UK | 5 | 1 | replace | 0 → 3 |  |  |
| 156 | geetanjali-studio-rajendra-nagar (page) | 156. Geetanjali Studio Pushp Tower Rajendra Nagar Dehradun UK | 7 |  | replace | 0 → 7 |  | old main photo moved to the end of the gallery |
| 155 | geetanjali-salon-mall-of-dehradun-dehradun-uk | 155. Geetanjali Salon Mall of Dehradun Dehradun UK | 6 |  | set | 0 → 5 |  |  |
| 154 | geetanjali-salon-r-14-c-scheme-jaipur-rajasthan | 154. Geetanjali Salon R-14 C Scheme Jaipur Rajasthan | 7 |  | set | 0 → 6 |  |  |
| 153 | geetanjali-studio-dlf-mall-of-india-noida-u-p | 153. Geetanjali Studio DLF Mall of India Noida U.P | 9 |  | set | 0 → 8 |  |  |
| 152 | geetanjali-salon-haldwani-uttarakhand | 152. Geetanjali Salon Shivam Marbles Nanital Road Haldwani UK | 10 |  | set | 0 → 9 |  |  |
| 151 | geetanjali-salon-aipl-sector-66-gurugram | 151. Geetanjali Salon AIPL Joy Central Sector 65 Gurgaon | 7 |  | set | 0 → 6 |  |  |
| 150 | geetanjali-salon-address-one-mall-dehradun-uttarakhand | 150. Geetanjali Salon Address One Mall Malsi Dehradun UK | 10 |  | set | 0 → 9 |  |  |
| 149 | tweak-salon-promenade-mall-vasant-kunj-new-delhi | 149. Tweak Salon DLF Promenade Mall Vasant Kunj New Delhi | 5 |  | set | 0 → 4 |  |  |
| 148 | geetanjali-salon-faridabad (page) | 148 Geetanjali Salon The Mall of Faridabad Pacific Mall Faridabad | 9 | 1 | replace | 0 → 7 |  |  |
| 147 | geetanjali-studio-ambition-business-park-patna-bihar | 147. Geetanjali Studio Ambition Business Park Patna Bihar | 6 |  | set | 0 → 5 |  |  |
| 146 | geetanjali-salon-kankarbagh-patna-bihar | 146. Geetanjali Salon Kankarbagh Patna Bihar | 5 |  | set | 0 → 4 |  |  |
| 145 | geetanjali-salon-guru-maa-civil-lines-rudrapur-uttarakhand | 145. Geetanjali Salon Civil Lines Rudrapur UK | 8 |  | set | 0 → 7 |  |  |
| 144 | punjabi-restaurant-gurugram (page) | 144. Punjabi By Nature Restaurant M3M IFC Sector 66 Gurgaon | 10 |  | replace | 0 → 10 |  | old main photo moved to the end of the gallery |
| 142 | tweak-salon (page) | 142. Tweak Salon Khan Market New Delhi | 8 |  | replace | 0 → 8 |  | old main photo moved to the end of the gallery |
| 141 | geetanjali-salon-pune-maharashtra | 141. Geetanjali Salon Pune Maharashtra | 4 |  | set | 0 → 3 |  |  |
| 140 | geetanjali-salon-rajpur-road-dehradun-uk | 140. Geetanjali Salon Rajpur Road Dehradun UK | 8 |  | set | 0 → 7 |  |  |
| 139 | geetanjali-studio-laxman-jhula-road-rishikesh-uk | 139. Geetanjali Studio Laxman Jhula Road Rishikesh UK | 8 |  | set | 0 → 7 |  |  |
| 138 | geetanjali-salon-civil-lines-bareilly | 138 Geetanjali Salon Civil Lines Bareilly U.P | 8 |  | set | 0 → 7 |  |  |
| 137 | geetanjali-studio-ranipur-more-haridwar-uk | 137 Geetanjali Studio Chandracharya Chowk Ranipur More Haridwar UK | 6 |  | set | 0 → 5 |  |  |
| 136 | black-express-salon (page) | 136 Black Express Unisex Salon Sector 104 Noida U.P | 5 | 1 | replace | 0 → 3 |  |  |
| 135 | geetanjali-salon-shyam-nagar-jaipur | 135. Geetanjali Salon Sarti Nagar Janpath Shyam Nagar Jaipur Rajasthan | 6 |  | set | 0 → 5 |  |  |
| 134 | geetanjali-salon-m3m-sector-65-gurgaon | 134 Geetanjali Salon M3M 65th Avenue Sector 65 Gurgaon | 8 |  | set | 0 → 7 |  |  |
| 133 | geetanjali-studio-kidwai-nagar-kanpur-u-p | 133 Geetanjali Studio Kidwai Nagar Kanpur U.P | 21 |  | set (first file, no hero.jpg) | 0 → 20 |  |  |
| 132 | marc-zenat-slimming-systems-mohali-punjab | 132. Marc Zenat Slimming Systems Industrial Area Mohali Punjab | 21 |  | set (first file, no hero.jpg) | 0 → 20 |  |  |
| 131 | geetanjali-salon-palladium-mall-ahmedabad-gujarat | 131 Geetanjali Salon Palladium Mall Ahmedabad Gujarat | 7 |  | set | 0 → 6 |  |  |
| 130 | geetanjali-studio-sector-13-vasundhara-ghaziabad-u-p | 130 Geetanjali Studio Sector 13 Vasundhara Ghaziabad U.P | 6 |  | set | 0 → 5 |  |  |
| 129 | lakme-salon-lajpat-nagar-kanpur-u-p | 129 Lakme Salon Lajpat Nagar Kanpur U.P | 7 |  | set | 0 → 6 |  |  |
| 128 | geetanjali-salon-ludhiana (page) | 128. Geetanjali Salon Paragon Waterfront South City Road Ludhiana Punjab | 14 |  | replace | 0 → 14 |  | old main photo moved to the end of the gallery |
| 125 | geetanjali-salon-saket (page) | 125 Geetanjali Salon Select Citywalk Mall Saket New Delhi | 8 |  | replace | 0 → 8 |  | old main photo moved to the end of the gallery |
| 124 | geetanjali-salon-shivalik-malviya-nagar-new-delhi | 124 Geetanjali Salon Shivalik Malviya Nagar New Delhi | 6 |  | set | 0 → 5 |  |  |
| 122 | he-and-she-unisex-salon-gandhi-market-area-minto-road-new-delhi | 122 He & She Unisex Salon Gandhi Market Area Minto Road New Delhi | 3 |  | set | 0 → 2 |  |  |
| 121 | geetanjali-studio-gulshan-one29-noida-u-p | 121 Geetanjali Studio Gulshan One29 Noida U.P | 7 |  | set | 0 → 6 |  |  |
| 120 | geetanjali-salon-hauz-khas-new-delhi | 120 Geetanjali Salon & Academy Hauz Khas New Delhi | 43 |  | set | 0 → 42 |  |  |
| 119 | geetanjali-salon-janakpuri-new-delhi | 119. Geetanjali Salon Janakpuri New Delhi | 7 |  | set | 0 → 6 |  |  |
| 118 | geetanjali-salon-gk-2-new-delhi | 118. Geetanjali Salon GK 2 New Delhi | 6 |  | set | 0 → 5 |  |  |
| 117 | geetanjali-salon-model-town-new-delhi | 117. Geetanjali Salon Model Town New Delhi | 6 |  | set | 0 → 5 |  |  |
| 116 | geetanjali-salon-malviya-nagar (page) | 116. Geetanjali Salon Malviya Nagar Jaipur Rajasthan | 7 |  | replace | 1 → 8 |  | old main photo moved to the end of the gallery |
| 115 | geetanjali-salon-lulu-mall-hariharpur-lucknow-u-p | 115. Geetanjali Salon Lulu Mall Hariharpur Lucknow U.P | 5 |  | set | 0 → 4 |  |  |
| 114 | geetanjali-studio-conscient-one-sector-109-gurgaon | 114. Geetanjali Studio Conscient One Sector 109 Gurgaon | 6 |  | set | 0 → 5 |  |  |
| 113 | geetanjali-salon-elante-mall-chandigarh | 113. Geetanjalo Salon Elante Mall Chandigarh | 5 |  | set | 0 → 4 |  |  |
| 112 | geetanjali-salon-khan-market-new-delhi | 112. Geetanjali Salon Khan Market New Delhi | 7 |  | set (first file, no hero.jpg) | 0 → 6 |  |  |
| 111 | trendz-salon-noida (page) | 111. Trendz Salon Sector 104 Noida U.P | 6 | 1 | replace | 0 → 4 |  |  |
| 109 | geetanjali-salon-ranchi-jharkhand (page) | 109. Geetanjali Salon Ranchi Jharkhand | 6 |  | keep (same photo) | 0 → 5 |  |  |
| 108 | geetanjali-salon-tagore-garden-new-delhi (page) | 108. Geetanjali Salon Pacific Mall Tagore Garden New Delhi | 6 |  | replace | 0 → 6 |  | old main photo moved to the end of the gallery |
| 107 | geetanjali-salon-sector-16b-noida (page) | 107. Geetanjali Salon Max Tower Sector 16B Noida U.P | 23 |  | keep (same photo) (first file, no hero.jpg) | 0 → 22 |  |  |
| 105 | geetanjali-salon-south-point-mall-gurgaon (page) | 105. Geetanjali Salon South Point Mall Gurgaon | 6 |  | replace | 0 → 6 |  | old main photo moved to the end of the gallery |
| 104 | geetanjali-salon-dlf-phase-4 (page) | 104. Geetanjali Salon Galleria Market DLF Phase 4 Gurgaon | 5 | 1 | replace | 0 → 3 |  |  |
| 103 | geetanjali-salon-vivek-vihar (page) | 103. Geetanjali Salon Ajnara Complex Vivek Vihar New Delhi | 9 |  | keep (same photo) | 0 → 8 |  |  |
| 102 | geetanjali-salon-pacific-mall (page) | 102. Geetanjali Salon Pacific Mall NSP Pitampura New Delhi | 7 |  | replace | 0 → 7 |  | old main photo moved to the end of the gallery |
| 101 | geetanjali-studio-ashiyana-lucknow-u-p | 101. Geetanjali Salon Ashiyana Lucknow U.P | 5 |  | set | 0 → 4 |  |  |
| 100 | geetanjali-salon-dehradun (page) | 100. Geetanjali Salon G.M.S Road Dehradun Uttarakhand | 10 |  | replace | 0 → 10 |  | old main photo moved to the end of the gallery |
| 99 | northwoodd-salon-rajouri-garden-extn-new-delhi | 99. Northwoodd Salon Rajouri Garden Extn New Delhi WM | 5 |  | set | 0 → 4 |  |  |
| 98 | geetanjali-salon-genesis-boring-road-crossing-patna-bihar | 98. Geetanjali Salon Genesis Boring Road Crossing Patna Bihar | 7 |  | set | 0 → 6 |  |  |
| 97 | geetanjali-studio-south-city-1-gurgaon | 97. Geetanjali Studio South City 1 Gurgaon WM | 8 |  | set | 0 → 7 |  |  |
| 96 | geetanjali-salon-sector-21c-main-market-faridabad-haryana | 96. Geetanjali Salon Sector 21C Main Market Faridabad Haryana WM | 7 |  | set | 0 → 6 |  |  |
| 95 | geetanjali-salon-food-mall-by-hush-sector-63-noida-u-p | 95. Geetanjali Salon Upper Ground Food Mall By Hush Sector-63 Noida U.P | 6 |  | set | 0 → 5 |  |  |
| 94 | studio-ess-salon-the-belaire-golf-course-road-sector-54-gurgaon | 94 Studio ESS Salon The Belaire Golf Course Road Sector 54 Gurgaon WM | 5 |  | set | 0 → 4 |  |  |
| 93 | geetanjali-salon-dlf-cyber-city-gurgaon | 93. Geetanjali Salon DLF Cyber City Gurgaon | 6 |  | set | 0 → 5 |  |  |
| 92 | bon-temps-salon-sector-98-noida-u-p | 92. Bon Temps Salon One Skymark Tower E Sector 98 Noida U.P | 7 |  | set | 0 → 6 |  |  |
| 91 | geetanjali-salon-vaishali-nagar-jaipur-rajasthan | 91. Geetanjali Salon Vaishali Nagar Jaipur Rajasthan | 8 |  | set | 0 → 7 |  |  |
| 90 | geetanjali-studio-gaur-central-mall-rdc-ghaziabad-u-p | 90. Geetanjali Studio Gaur Central Mall RDC Raj Nagar Ghaziabad U.P | 4 |  | set | 0 → 3 |  |  |
| 89 | geetanjali-studio-pla-market-hisar-haryana | 89. Geetanjali Studio PLA Market Hisar Haryana | 5 |  | set | 0 → 4 |  |  |
| 88 | geetanjali-studio-sapphire-ninety-sector-90-gurgaon | 88. Geetanjali Studio Sapphire Ninety Sector 90 Gurgaon | 5 |  | set | 0 → 4 |  |  |
| 87 | extension-port-salon-fun-republic-mall-gomti-nagar-lucknow-u-p | 87. Extension Port Salon Fun Republic Mall Gomti Nagar Lucknow U.P | 3 |  | set | 0 → 2 |  |  |
| 86 | geetanjali-studio-model-town-rohtak-haryana | 86. Geetanjali Studio Model Town Rohtak Haryana | 4 |  | set | 0 → 3 |  |  |
| 85 | geetanjali-studio-gardenia-glory-sector-46-noida-u-p | 85. Geetanjali Studio Gardenia Glory Sector 46 Noida U.P | 4 |  | set | 0 → 3 |  |  |
| 84 | geetanjali-studio-emaar-palm-hills-sector-77-gurgaon | 84. Geetanjali Studio Emaar Palm Hills Sector 77 Gurgaon | 3 |  | set | 0 → 2 |  |  |
| 83 | knuckout-unisex-salon-n-spa-sector-8-panchkula-haryana | 83. Knuckout Unisex Salon N Spa Sector 8 Panchkula Haryana | 6 |  | set | 0 → 5 |  |  |
| 82 | encanto-unisex-salon-nail-cafe-naraina-vihar-new-delhi | 82. Encanto Unisex Salon Nail Cafe Naraina Vihar New Delhi | 6 |  | set | 0 → 5 |  |  |
| 81 | ivory-room-salon-and-spa-huda-market-sector-56-gurgaon | 81. Ivory Room Salon & Spa Huda Market Sector 56 Gurgaon | 6 |  | set | 0 → 5 |  |  |
| 80 | geetanjali-salon-lucknow (page) | 80. Geetanjali Salon Phoenix Palassio Mall Lucknow U.P | 5 |  | replace | 0 → 5 |  | old main photo moved to the end of the gallery |
| 79 | geetanjali-salon-worldmark (page) | 79. Geetanjali Salon Worldmark  Sector 65 Gurgaon | 7 |  | replace | 0 → 7 |  | old main photo moved to the end of the gallery |
| 78 | hob-salon-janakpuri-new-delhi | 78. HOB Salon Janakpuri New Delhi | 7 |  | set | 0 → 6 |  |  |
| 77 | geetanjali-salon-mukut-house-amritsar-punjab | 77. Geetanjali Salon Mukut House Amritsar Punjab | 8 |  | set | 0 → 7 |  |  |
| 76 | geetanjali-salon-r-14-c-scheme-jaipur-rajasthan-2 | 76. Geetanjali Salon R-14 C Scheme Jaipur Rajasthan | 7 |  | set | 0 → 6 |  |  |
| 75 | tweak-salon-dlf-place-saket-new-delhi | 75. Tweak Salon Dlf Place Saket New Delhi | 6 |  | set | 0 → 5 |  |  |
| 74 | marc-zenat-slimming-systems-imt-manesar-gurgaon | 74. Marc Zenat Slimming Systems IMT Manesar Gurgaon | 8 |  | set | 0 → 7 |  |  |
| 73 | bon-temps-salon-saket-new-delhi | 73. Bon Temps Salon Saket New Delhi | 7 |  | set | 0 → 6 |  |  |
| 72 | geetanjali-studio-jayanti-mall-alwar-rajasthan | 72. Geetanjali Studio Jayanti Mall Alwar Rajasthan | 5 |  | set | 0 → 4 |  |  |
| 71 | geetanjali-salon-esplanade-1-mall-rasulgarh-bhubaneswar | 71. Geetanjali Salon Esplanade 1 Mall Rasulgarh Bhubaneswar | 5 |  | set | 0 → 4 |  |  |
| 70 | geetanjali-salon-elante-mall-chandigarh-2 | 70. Geetanjali Salon Elante Mall Chandigarh | 6 |  | set | 0 → 5 |  |  |
| 69 | geetanjali-salon-gaur-city-mall-sector-4-greater-noida-u-p | 69. Geetanjali Salon Gaur City Mall Sector 4 Greater Noida | 6 |  | set | 0 → 5 |  |  |
| 68 | geetanjali-salon-starling-mall-sector-104-noida-u-p | 68. Geetanjali Salon Starling Mall Sector 104 Noida | 8 |  | set | 0 → 7 |  |  |
| 67 | geetanjali-salon-vegas-mall-sector-14-dwarka-new-delhi | 67. Geetanjali Salon Vegas Mall Sector-14 Dwarka New Delhi | 11 |  | set | 0 → 10 |  |  |
| 66 | geetanjali-salon-pusa-road-karol-bagh-new-delhi | 66. Geetanjali Salon Pusa Road Karol Bagh New Delhi | 6 |  | set | 0 → 5 |  |  |
| 65 | geetanjali-salon-sector-11-dwarka-new-delhi | 65. Geetanjali Salon Sector 11 Dwarka New Delhi | 6 |  | set | 0 → 5 |  |  |
| 64 | geetanjali-studio-victory-valley-sector-67-gurgaon | 64. Geetanjali Studio Victory Valley Sector 67 Gurgaon | 9 |  | set | 0 → 8 |  |  |
| 63 | geetanjali-salon-ranchi-jharkhand-2 | 63. Geetanjali Salon Ranchi Jharkhand | 6 |  | set | 0 → 5 |  |  |
| 62 | geetanjali-salon-ambience-mall-gurgaon | 62. Geetanjali Salon Ambience Mall Gurgaon | 6 |  | set | 0 → 5 |  |  |
| 61 | geetanjali-studio-paras-trinity-sector-63-gurgaon | 61. Geetanjali Studio Paras Trinity Sector 63 Gurgaon | 5 |  | set | 0 → 4 |  |  |
| 60 | geetanjali-studio-tilak-nagar-new-delhi | 60. Geetanjali Studio Tilak Nagar New Delhi | 27 |  | set (first file, no hero.jpg) | 0 → 26 |  |  |
| 59 | geetanjali-studio-naraina-new-delhi | 59. Geetanjali Studio Naraina New Delhi | 7 |  | set | 0 → 6 |  |  |
| 58 | vandna-s-salon-lucknow-u-p | 58. Vandna's Salon Lucknow U.P | 6 |  | set | 0 → 5 |  |  |
| 57 | nail-cafe-by-encanto-elante-mall-chandigarh | 57. Nail Cafe by Encanto Elante Mall Chandigarh | 5 |  | set | 0 → 4 |  |  |
| 56 | hakim-aalim-salon-gk-1-m-block-market-new-delhi | 56. Hakim Aalim Salon Gk 1 New Delhi | 9 |  | set | 0 → 8 |  |  |
| 55 | geetanjali-salon-kamla-nagar-new-delhi | 55. Geetanjali Salon Kamla Nagar New Delhi | 9 |  | set | 0 → 8 |  |  |
| 54 | preet-wellness-and-makeover-studio-zirakpur-punjab | 54. Preet Wellness & Makeover Studio Zirakpur Punjab | 6 |  | set | 0 → 5 |  |  |
| 53 | geetanjali-salon-vasant-vihar-priya-market-new-delhi | 53. Geetanjali Salon Vasant Vihar New Delhi - Copy | 10 |  | set | 0 → 9 |  |  |
| 52 | wildbloom-salon-cross-point-mall-dlf-phase-4-gurgaon | 52. Wildbloom Salon Cross Point Mall Dlf Phase 4 Gurgaon | 5 |  | set | 0 → 4 |  |  |
| 51 | geetanjali-salon-ardee-city-mall-gurgaon | 51. Geetanjali Salon Ardee Mall Gurgaon | 6 |  | set | 0 → 5 |  |  |
| 50 | sebastiana-unisex-salon-gk-2-m-block-market-new-delhi | 50. Sebastiana Salon Gk 2 New Delhi | 7 |  | set | 0 → 6 |  |  |
| 49 | bon-temps-salon-green-park-new-delhi | 49. Bon Temps Salon Green Park New Delhi | 8 |  | set | 0 → 7 |  |  |
| 48 | wilson-s-scissor-art-salon-palm-drive-sector-66-gurgaon | 48. Wilson's Scissor Art Salon Palm Drive Sector 66 Gurgaon | 7 |  | set | 0 → 6 |  |  |
| 47 | geetanjali-salon-model-town-new-delhi-2 | 47. Geetanjali Salon Model Town New Delhi | 8 |  | set | 0 → 7 |  |  |
| 46 | geetanjali-salon-punjabi-bagh-new-delhi | 46. Geetanjali Salon Punjabi Bagh New Delhi | 8 |  | set | 0 → 7 |  |  |
| 45 | geetanjali-salon-vatika-business-park-sohna-road-gurgaon | 45. Geetanjali Salon Vatika Business Park Sohna Road Gurgaon | 8 |  | set | 0 → 7 |  |  |
| 44 | geetanjali-salon-mgf-metropolitan-mall-gurgaon | 44. Geetanjali Salon Mgf Metropolitan Mall Gurgaon | 8 |  | set | 0 → 7 |  |  |
| 43 | geetanjali-studio-omaxe-nri-mall-greater-noida-u-p | 43. Geetanjali Studio Omaxe NRI City Centre Mall Greater Noida | 8 |  | set | 0 → 7 |  |  |
| 42 | geetanjali-studio-sector-18-noida-u-p | 42. Geetanjali Studio Sector 18 Noida | 8 |  | set | 0 → 7 |  |  |
| 41 | geetanjali-salon-cyber-hub-gurgaon | 41. Geetanjali Salon DLF Cyber Hub Gurgaon | 9 |  | set | 0 → 8 |  |  |
| 40 | geetanjali-salon-kanpur-u-p | 40. Geetanjali Salon Kanpur U.P | 13 |  | set | 0 → 12 |  |  |
| 39 | geetanjali-salon-chhatarpur-new-delhi | 39. Geetanjali Salon Chhatarpur New Delhi | 12 |  | set | 0 → 11 |  |  |
| 38 | sarman-the-makeover-studio-m3m-sector-66-gurgaon | 38. Makeover Studio by Sarman M3M Sector 66 Gurgaon | 7 |  | set | 0 → 6 |  |  |
| 37 | ozone-salon-rohtak-haryana | 37. Ozone Salon Ashoka Plaza Rohtak Haryana | 6 |  | set | 0 → 5 |  |  |
| 36 | sarman-the-makeover-studio-unitech-cyber-park-gurgaon | 36. Makeover Studio by Sarman Unitech Cyber Park Gurgaon | 6 |  | set | 0 → 5 |  |  |
| 35 | beauty-and-beard-salon-m3m-sector-66-gurgaon | 35. Beauty & Beard Salon M3M Sector 66 Gurgaon | 9 |  | set | 0 → 8 |  |  |
| 34 | gr8-salon-dlf-phase-3-gurgaon | 34. GR8 Salon Dlf Phase 3 Gurgaon | 6 |  | set | 0 → 5 |  |  |
| 33 | martina-wu-salon-malviya-nagar-new-delhi | 33. Martina Wu Salon Shivalik Colony Malviya Nagar New Delhi | 6 |  | set | 0 → 5 |  |  |
| 32 | simrann-s-salon-v-club-gurgaon | 32. Simran Salon V Club Gurgaon | 4 |  | set | 0 → 3 |  |  |
| 31 | uma-maurya-s-salon-super-mart-1-gurgaon | 31. Uma Maurya's Salon Super Mart 1 GGN | 7 |  | set | 0 → 6 |  |  |
| 30 | fabu-salon-sector-17-dwarka-new-delhi | 30. Fab U Salon Sector 17 Dwarka | 5 |  | set | 0 → 4 |  |  |
| 29 | magnolia-salon-sector-14-gurgaon | 29. Magnolia Salon Sector 14 Gurgaon | 6 |  | set | 0 → 5 |  |  |
| 28 | geet-s-makeup-studio-sector-25-panchkula-haryana | 28. Geets Makeup Studio Panchkula Sector 25 | 6 |  | set | 0 → 5 |  |  |
| 27 | revital-mantra-salon-sector-76-noida-u-p | 27. Revital Mantra Salon Sector 76 Noida | 6 |  | set | 0 → 5 |  |  |
| 26 | fa-professional-salon-sector-55-gurgaon | 26. FA Professional Salon Suncity Gurgaon | 6 |  | set | 0 → 5 |  |  |
| 25 | headline-salon-makenews-sector-69-gurgaon | 25. Headlines Salon Sector 69 Gurgaon | 5 |  | set | 0 → 4 |  |  |
| 24 | strike-a-pose-salon-galleria-market-gurgaon | 24. Strike a Pose Salon Galleria Market Gurgaon | 5 |  | set | 0 → 4 |  |  |
| 23 | iza-setia-makeovers-lajpat-nagar-new-delhi | 23. Iza Setia Makeovers lajpat Nagar Delhi | 6 |  | set | 0 → 5 |  |  |
| 22 | headonizm-40-salon-gk-2-m-block-market-new-delhi | 22. Headonizm 40 Salon Gk 2 New Delhi | 8 |  | set | 0 → 7 |  |  |
| 21 | api-ruche-unisex-spalon-baani-sector-56-gurgaon | 21. Api Ruche Wellness Pvt.Ltd Gurgaon | 6 |  | set | 0 → 5 |  |  |
| 20 | la-adorable-salon-sector-66-gurgaon | 20. La Adorabelle Salon Sector 66 Gurgaon | 5 |  | set | 0 → 4 |  |  |
| 19 | nails-at-dalip-salon-priya-market-vasant-vihar-new-delhi | 20. La Adorabelle Salon Sector 66 Gurgaon/19. Nails @ Dalip Salon Vasant Vihar Delhi | 5 |  | set | 0 → 4 |  |  |
| 18 | verma-s-salon-and-academy-sector-50-noida-u-p | 18. Verma's Academy Sector 50 Noida | 7 |  | set | 0 → 6 |  |  |
| 17 | verma-s-unisex-salon-sector-45-noida-u-p | 17. Verma's Salon Sector 45 Noida | 6 |  | set | 0 → 5 |  |  |
| 16 | simrann-s-salon-rajinder-nagar-new-delhi | 16. Simrann's Salon New Rajinder Nagar Delhi | 5 |  | set | 0 → 4 |  |  |
| 15 | mam-s-and-babe-s-salon-vaishali-ghaziabad-u-p | 15. Mams & Babes Salon Vaishali Ghaziabad | 5 |  | set | 0 → 4 |  |  |
| 14 | style-studio-salon-ashok-vihar-new-delhi | 14. Style Studio Salon Ashok Vihar New Delhi | 6 |  | set | 0 → 5 |  |  |
| 13 | esskay-beauty-resources-udyog-vihar-gurgaon | 13. Esskay Beauty Gurgaon Showroom | 6 |  | set | 0 → 5 |  |  |
| 12 | kittn-salon-karnal-haryana | 12. Kittn Salon Karnal | 6 |  | set | 0 → 5 |  |  |
| 11 | knuckout-unisex-salon-n-spa-patiala-punjab | 11. Knuckout Salon Patiala | 5 |  | set | 0 → 4 |  |  |
| 10 | hair-scape-salon-rodeo-drive-south-city-2-gurgaon | 10. Hair Scape Salon South City Gurgaon | 5 |  | set | 0 → 4 |  |  |
| 9 | sandy-s-salon-bestech-park-gurgaon | 9. Sandy Salon Sohna Road Gurgaon | 4 |  | set | 0 → 3 |  |  |
| 8 | simrann-s-salon-palm-spring-gurgaon | 8. Simrann's Salon Palm Spring Gurgaon | 5 |  | set | 0 → 4 |  |  |
| 7 | naturals-c-r-park-new-delhi | 7. Naturals Salon CR Park New Delhi | 5 | 4 | keep (same photo) | 4 → 4 |  |  |
| 6 | riya-vashist-salon-geeta-colony-new-delhi | 6. Riya Vashisth Salon Geeta Colony Delhi | 5 | 4 | keep (same photo) | 4 → 4 |  |  |
| 5 | the-bimini-road-sohna-road-gurgaon | 5. The Bimini Road Salon Sohna Road GGN | 5 | 4 | keep (same photo) | 4 → 4 |  |  |
| 4 | amber-salon-sector-31-gurgaon | 4. Amber Salon, Sec 31 Gurgaon | 5 | 4 | keep (same photo) | 4 → 4 |  |  |
| 3 | headonizm-40-salon-nfc-new-delhi | 3. Headonizm 40 Unisex Salon NFC New Delhi | 5 | 4 | keep (same photo) | 4 → 4 |  |  |
| 2 | la-fleur-salon-karol-bagh-new-delhi | 2. La Flure Salon Karol Bagh Delhi | 5 | 4 | keep (same photo) | 4 → 4 |  |  |
| 1 | esskay-beauty-resources-karol-bagh-new-delhi | 1. Esskay Beauty Karol Bagh,Delhi | 5 | 4 | keep (same photo) | 4 → 4 |  |  |

---

# Step A — folder scan (approved 2026-09-25)

Generated 2026-09-25 from `C:edited for website (projects )IMPORTANT DONOT DLETE`. Read-only: nothing was copied, uploaded or changed.

## Naming rule (approved)

- `hero.jpg` / `hero.jpeg` = **main photo** (you already use this name in 165 of 170 folders).
- `before-*.jpg` = **before** images (none exist yet).
- Everything else = **gallery**, in natural file-name order (1, 2, … 10, 11 — not 1, 10, 11, 2).
- A folder with no `hero.*`: the first gallery file becomes the main photo.
- Skipped: `desktop.ini`, and the hidden `.picasaoriginals` backup folder.

## The 34 project pages (257 photos)

| Page (slug) | Folder | Photos | Main photo | Gallery | Link |
|---|---|---|---|---|---|
| `aloevera-salon-noida` | 175. Aloevera Salon Central 50 Mall Sector 50 Noida U.P | 6 | hero.jpeg | 5 | as today |
| `bellissima-unisex-salon` | 169. Bellissima Unisex Salon by Jyoti Sector 7 Dwarka New Delhi | 4 | hero.jpeg | 3 | as today |
| `black-express-salon` | 136 Black Express Unisex Salon Sector 104 Noida U.P | 5 | hero.JPG | 4 | as today |
| `dopulence-salon` | 165. Dopulence Salon Kankarbagh Patna Bihar | 7 | hero.jpeg | 6 | as today |
| `eesha-salon` | 167. Eesha Salon AIPL Joy Street Sector 66 Gurugram | 7 | hero.JPG | 6 | as today |
| `geetanjali-academy-dehradun` | 157. Geetanjali Academy Prabhat Takij Chakrata Road Dehradun UK | 5 | hero.JPG | 4 | as today |
| `geetanjali-salon-dehradun` | 100. Geetanjali Salon G.M.S Road Dehradun Uttarakhand | 10 | hero.jpg | 9 | **CORRECTED** — see below |
| `geetanjali-salon-dlf-phase-4` | 104. Geetanjali Salon Galleria Market DLF Phase 4 Gurgaon | 5 | hero.JPG | 4 | **CORRECTED** — see below |
| `geetanjali-salon-faridabad` | 148 Geetanjali Salon The Mall of Faridabad Pacific Mall Faridabad | 9 | hero.JPG | 8 | as today |
| `geetanjali-salon-gurugram` | 181. Geetanjali Salon Felix Plaza Sector 82 Gurugram | 7 | hero.jpeg | 6 | **CORRECTED** — see below |
| `geetanjali-salon-ireo` | 158. Geetanjali Salon IREO The Grand View High Street Sector 58 Gurgaon | 10 | hero.JPG | 9 | as today |
| `geetanjali-salon-jharkhand` | 164. Geetanjali Salon Jhamshedpur Jharkhand | 5 | hero.jpeg | 4 | as today |
| `geetanjali-salon-lucknow` | 80. Geetanjali Salon Phoenix Palassio Mall Lucknow U.P | 5 | hero.jpg | 4 | as today |
| `geetanjali-salon-ludhiana` | 128. Geetanjali Salon Paragon Waterfront South City Road Ludhiana Punjab | 14 | hero.JPG | 13 | as today |
| `geetanjali-salon-malviya-nagar` | 116. Geetanjali Salon Malviya Nagar Jaipur Rajasthan | 7 | hero.jpeg | 6 | as today |
| `geetanjali-salon-pacific-mall` | 102. Geetanjali Salon Pacific Mall NSP Pitampura New Delhi | 7 | hero.JPG | 6 | as today |
| `geetanjali-salon-ranchi-jharkhand` | 109. Geetanjali Salon Ranchi Jharkhand | 6 | hero.jpeg | 5 | as today |
| `geetanjali-salon-saket` | 125 Geetanjali Salon Select Citywalk Mall Saket New Delhi | 8 | hero.JPG | 7 | as today |
| `geetanjali-salon-sector-16b-noida` | 107. Geetanjali Salon Max Tower Sector 16B Noida U.P | 23 | 1.JPG *(no hero — first file)* | 22 | as today |
| `geetanjali-salon-south-point-mall-gurgaon` | 105. Geetanjali Salon South Point Mall Gurgaon | 6 | hero.JPG | 5 | as today |
| `geetanjali-salon-tagore-garden-new-delhi` | 108. Geetanjali Salon Pacific Mall Tagore Garden New Delhi | 6 | hero.JPG | 5 | as today |
| `geetanjali-salon-vasant-vihar` | 161. Geetanjali Salon Vasant Vihar Priya Market New Delhi | 9 | hero.JPG | 8 | as today |
| `geetanjali-salon-vensejmall` | 163. Geetanjali Studio Vensej Mall Sector 57 Gurgaon | 7 | hero.JPG | 6 | **CORRECTED** — see below |
| `geetanjali-salon-vivek-vihar` | 103. Geetanjali Salon Ajnara Complex Vivek Vihar New Delhi | 9 | hero.JPG | 8 | as today |
| `geetanjali-salon-worldmark` | 79. Geetanjali Salon Worldmark  Sector 65 Gurgaon | 7 | hero.jpg | 6 | as today |
| `geetanjali-studio-ajmer` | 166. Geetanjali Studio Anasagar Circular Road Ajmer Rajasthanj | 7 | hero.JPG | 6 | **CORRECTED** — see below |
| `geetanjali-studio-rajendra-nagar` | 156. Geetanjali Studio Pushp Tower Rajendra Nagar Dehradun UK | 7 | hero.jpeg | 6 | as today |
| `hakim-ali-salon` | 180. Hakim Ali Salon High Street Apollo Indore M.P | 4 | hero.JPG | 3 | as today |
| `madonna-salon` | 172. Madonna Salon Greenfield Colony Sector 43 Faridabad Haryana | 5 | hero.jpeg | 4 | as today |
| `peluqueria-salon-lucknow` | 176. Peluqueria Salon Emaar Gomti Green Lucknow U.P | 9 | hero.jpeg | 8 | as today |
| `punjabi-restaurant-gurugram` | 144. Punjabi By Nature Restaurant M3M IFC Sector 66 Gurgaon | 10 | hero.JPG | 9 | as today |
| `toni-and-guy` | 173. Toni & Guy Salon Indirapuram Habitat Centre Ghaziabad U.P | 7 | hero.JPG | 6 | as today |
| `trendz-salon-noida` | 111. Trendz Salon Sector 104 Noida U.P | 6 | hero.JPG | 5 | as today |
| `tweak-salon` | 142. Tweak Salon Khan Market New Delhi | 8 | hero.JPG | 7 | as today |

Pages without a folder: **none** — all 34 have photos.

## Page links that are wrong today (proposed corrections)

| Page | Linked today to | Should be | Evidence |
|---|---|---|---|
| `geetanjali-salon-dlf-phase-4` | #93 Geetanjali Salon (DLF Cyber City Gurgaon) | #104 Geetanjali Salon (Galleria Market Gurgaon) | the page's photo IS in folder 104 (visual match, distance 13/256) |
| `geetanjali-salon-vensejmall` | #62 Geetanjali Salon (Ambience Mall Gurgaon) | #163 Geetanjali Studio (Sector 57 Gurgaon) | the page's photo IS in folder 163 (visual match, distance 6/256) |
| `geetanjali-studio-ajmer` | #182 Geetanjali Studio (Alwar  Rajasthan) | #166 Geetanjali Studio (Anasagar Circular Road Ajmer Rajasthan) | page says "Ajmer"; #182 is Alwar; #166 is the only Ajmer project |
| `geetanjali-salon-dehradun` | #170 Geetanjali Salon (EC Road Dehradun Uttarakhand) | #100 Geetanjali Salon (G.M.S Road Dehradun Uttarakhand) | page says "GMS Road, Dehradun"; #170 is EC Road; #100 is G.M.S Road |
| `geetanjali-salon-gurugram` | #151 Geetanjali Salon (AIPL Sector 66 Gurugram) | #181 Geetanjali Salon (Felix Plaza Mall Gurugam) | page says "Sector 82"; #151 is Sector 65; #181 is Felix Plaza Sector 82 |

## Folders that need a decision

- `185. Fab U Salon Piru Vihar Delhi Cantt Delhi` — #185 is Bellance Salon (Raipur). The name matches **#187** Fab U Salon (Piru Vihar Sadar Bazar Delhi Cantt). Proposed: treat as #187.
- `20. La Adorabelle Salon Sector 66 Gurgaon` contains a whole project folder `19. Nails @ Dalip Salon Vasant Vihar Delhi` — proposed: treat it as project #19's folder.
- `120 Geetanjali Salon & Academy Hauz Khas` has an `ACADEMY` subfolder — proposed: add its photos to #120's gallery (same project), after the main folder's.
- `82. Encanto…/.picasaoriginals` — Picasa's hidden copies of the pre-edit originals. Proposed: skip.
- 6 folders have no `hero.jpg`: 107. Geetanjali Salon Max Tower Sector 16B Noida U.P → 1.JPG; 112. Geetanjali Salon Khan Market New Delhi → 2.JPG; 132. Marc Zenat Slimming Systems Industrial Area Mohali Punjab → 1.JPG; 133 Geetanjali Studio Kidwai Nagar Kanpur U.P → 1.JPG; 185. Fab U Salon Piru Vihar Delhi Cantt Delhi → 1.JPG; 60. Geetanjali Studio Tilak Nagar New Delhi → 1.JPG.

## The other 136 folders (projects with no page on the site yet — 934 photos)

| # | Folder | Project slug | Photos | Main photo |
|---|---|---|---|---|
| 1 | 1. Esskay Beauty Karol Bagh,Delhi | `esskay-beauty-resources-karol-bagh-new-delhi` | 5 | hero.jpg |
| 2 | 2. La Flure Salon Karol Bagh Delhi | `la-fleur-salon-karol-bagh-new-delhi` | 5 | hero.jpg |
| 3 | 3. Headonizm 40 Unisex Salon NFC New Delhi | `headonizm-40-salon-nfc-new-delhi` | 5 | hero.jpg |
| 4 | 4. Amber Salon, Sec 31 Gurgaon | `amber-salon-sector-31-gurgaon` | 5 | hero.jpg |
| 5 | 5. The Bimini Road Salon Sohna Road GGN | `the-bimini-road-sohna-road-gurgaon` | 5 | hero.jpg |
| 6 | 6. Riya Vashisth Salon Geeta Colony Delhi | `riya-vashist-salon-geeta-colony-new-delhi` | 5 | hero.jpg |
| 7 | 7. Naturals Salon CR Park New Delhi | `naturals-c-r-park-new-delhi` | 5 | hero.JPG |
| 8 | 8. Simrann's Salon Palm Spring Gurgaon | `simrann-s-salon-palm-spring-gurgaon` | 5 | hero.jpg |
| 9 | 9. Sandy Salon Sohna Road Gurgaon | `sandy-s-salon-bestech-park-gurgaon` | 4 | hero.JPG |
| 10 | 10. Hair Scape Salon South City Gurgaon | `hair-scape-salon-rodeo-drive-south-city-2-gurgaon` | 5 | hero.JPG |
| 11 | 11. Knuckout Salon Patiala | `knuckout-unisex-salon-n-spa-patiala-punjab` | 5 | hero.JPG |
| 12 | 12. Kittn Salon Karnal | `kittn-salon-karnal-haryana` | 6 | hero.jpg |
| 13 | 13. Esskay Beauty Gurgaon Showroom | `esskay-beauty-resources-udyog-vihar-gurgaon` | 6 | hero.jpg |
| 14 | 14. Style Studio Salon Ashok Vihar New Delhi | `style-studio-salon-ashok-vihar-new-delhi` | 6 | hero.jpg |
| 15 | 15. Mams & Babes Salon Vaishali Ghaziabad | `mam-s-and-babe-s-salon-vaishali-ghaziabad-u-p` | 5 | hero.jpg |
| 16 | 16. Simrann's Salon New Rajinder Nagar Delhi | `simrann-s-salon-rajinder-nagar-new-delhi` | 5 | Hero.jpg |
| 17 | 17. Verma's Salon Sector 45 Noida | `verma-s-unisex-salon-sector-45-noida-u-p` | 6 | hero.JPG |
| 18 | 18. Verma's Academy Sector 50 Noida | `verma-s-salon-and-academy-sector-50-noida-u-p` | 7 | hero.JPG |
| 20 | 20. La Adorabelle Salon Sector 66 Gurgaon | `la-adorable-salon-sector-66-gurgaon` | 5 | hero.JPG |
| 21 | 21. Api Ruche Wellness Pvt.Ltd Gurgaon | `api-ruche-unisex-spalon-baani-sector-56-gurgaon` | 6 | hero.JPG |
| 22 | 22. Headonizm 40 Salon Gk 2 New Delhi | `headonizm-40-salon-gk-2-m-block-market-new-delhi` | 8 | hero.JPG |
| 23 | 23. Iza Setia Makeovers lajpat Nagar Delhi | `iza-setia-makeovers-lajpat-nagar-new-delhi` | 6 | hero.JPG |
| 24 | 24. Strike a Pose Salon Galleria Market Gurgaon | `strike-a-pose-salon-galleria-market-gurgaon` | 5 | hero.jpg |
| 25 | 25. Headlines Salon Sector 69 Gurgaon | `headline-salon-makenews-sector-69-gurgaon` | 5 | hero.JPG |
| 26 | 26. FA Professional Salon Suncity Gurgaon | `fa-professional-salon-sector-55-gurgaon` | 6 | hero.jpg |
| 27 | 27. Revital Mantra Salon Sector 76 Noida | `revital-mantra-salon-sector-76-noida-u-p` | 6 | hero.jpg |
| 28 | 28. Geets Makeup Studio Panchkula Sector 25 | `geet-s-makeup-studio-sector-25-panchkula-haryana` | 6 | hero.JPG |
| 29 | 29. Magnolia Salon Sector 14 Gurgaon | `magnolia-salon-sector-14-gurgaon` | 6 | hero.JPG |
| 30 | 30. Fab U Salon Sector 17 Dwarka | `fabu-salon-sector-17-dwarka-new-delhi` | 5 | hero.jpg |
| 31 | 31. Uma Maurya's Salon Super Mart 1 GGN | `uma-maurya-s-salon-super-mart-1-gurgaon` | 7 | hero.JPG |
| 32 | 32. Simran Salon V Club Gurgaon | `simrann-s-salon-v-club-gurgaon` | 4 | hero.jpg |
| 33 | 33. Martina Wu Salon Shivalik Colony Malviya Nagar New Delhi | `martina-wu-salon-malviya-nagar-new-delhi` | 6 | hero.jpg |
| 34 | 34. GR8 Salon Dlf Phase 3 Gurgaon | `gr8-salon-dlf-phase-3-gurgaon` | 6 | hero.JPG |
| 35 | 35. Beauty & Beard Salon M3M Sector 66 Gurgaon | `beauty-and-beard-salon-m3m-sector-66-gurgaon` | 9 | hero.JPG |
| 36 | 36. Makeover Studio by Sarman Unitech Cyber Park Gurgaon | `sarman-the-makeover-studio-unitech-cyber-park-gurgaon` | 6 | hero.JPG |
| 37 | 37. Ozone Salon Ashoka Plaza Rohtak Haryana | `ozone-salon-rohtak-haryana` | 6 | hero.jpg |
| 38 | 38. Makeover Studio by Sarman M3M Sector 66 Gurgaon | `sarman-the-makeover-studio-m3m-sector-66-gurgaon` | 7 | hero.JPG |
| 39 | 39. Geetanjali Salon Chhatarpur New Delhi | `geetanjali-salon-chhatarpur-new-delhi` | 12 | hero.JPG |
| 40 | 40. Geetanjali Salon Kanpur U.P | `geetanjali-salon-kanpur-u-p` | 13 | hero.JPG |
| 41 | 41. Geetanjali Salon DLF Cyber Hub Gurgaon | `geetanjali-salon-cyber-hub-gurgaon` | 9 | hero.JPG |
| 42 | 42. Geetanjali Studio Sector 18 Noida | `geetanjali-studio-sector-18-noida-u-p` | 8 | hero.JPG |
| 43 | 43. Geetanjali Studio Omaxe NRI City Centre Mall Greater Noida | `geetanjali-studio-omaxe-nri-mall-greater-noida-u-p` | 8 | hero.JPG |
| 44 | 44. Geetanjali Salon Mgf Metropolitan Mall Gurgaon | `geetanjali-salon-mgf-metropolitan-mall-gurgaon` | 8 | hero.JPG |
| 45 | 45. Geetanjali Salon Vatika Business Park Sohna Road Gurgaon | `geetanjali-salon-vatika-business-park-sohna-road-gurgaon` | 8 | hero.JPG |
| 46 | 46. Geetanjali Salon Punjabi Bagh New Delhi | `geetanjali-salon-punjabi-bagh-new-delhi` | 8 | hero.JPG |
| 47 | 47. Geetanjali Salon Model Town New Delhi | `geetanjali-salon-model-town-new-delhi-2` | 8 | hero.JPG |
| 48 | 48. Wilson's Scissor Art Salon Palm Drive Sector 66 Gurgaon | `wilson-s-scissor-art-salon-palm-drive-sector-66-gurgaon` | 7 | hero.JPG |
| 49 | 49. Bon Temps Salon Green Park New Delhi | `bon-temps-salon-green-park-new-delhi` | 8 | hero.JPG |
| 50 | 50. Sebastiana Salon Gk 2 New Delhi | `sebastiana-unisex-salon-gk-2-m-block-market-new-delhi` | 7 | hero.JPG |
| 51 | 51. Geetanjali Salon Ardee Mall Gurgaon | `geetanjali-salon-ardee-city-mall-gurgaon` | 6 | hero.JPG |
| 52 | 52. Wildbloom Salon Cross Point Mall Dlf Phase 4 Gurgaon | `wildbloom-salon-cross-point-mall-dlf-phase-4-gurgaon` | 5 | hero.jpeg |
| 53 | 53. Geetanjali Salon Vasant Vihar New Delhi - Copy | `geetanjali-salon-vasant-vihar-priya-market-new-delhi` | 10 | hero.JPG |
| 54 | 54. Preet Wellness & Makeover Studio Zirakpur Punjab | `preet-wellness-and-makeover-studio-zirakpur-punjab` | 6 | hero.jpg |
| 55 | 55. Geetanjali Salon Kamla Nagar New Delhi | `geetanjali-salon-kamla-nagar-new-delhi` | 9 | hero.jpg |
| 56 | 56. Hakim Aalim Salon Gk 1 New Delhi | `hakim-aalim-salon-gk-1-m-block-market-new-delhi` | 9 | hero.JPG |
| 57 | 57. Nail Cafe by Encanto Elante Mall Chandigarh | `nail-cafe-by-encanto-elante-mall-chandigarh` | 5 | hero.jpg |
| 58 | 58. Vandna's Salon Lucknow U.P | `vandna-s-salon-lucknow-u-p` | 6 | hero.jpg |
| 59 | 59. Geetanjali Studio Naraina New Delhi | `geetanjali-studio-naraina-new-delhi` | 7 | hero.JPG |
| 60 | 60. Geetanjali Studio Tilak Nagar New Delhi | `geetanjali-studio-tilak-nagar-new-delhi` | 27 | 1.JPG |
| 61 | 61. Geetanjali Studio Paras Trinity Sector 63 Gurgaon | `geetanjali-studio-paras-trinity-sector-63-gurgaon` | 5 | hero.JPG |
| 62 | 62. Geetanjali Salon Ambience Mall Gurgaon | `geetanjali-salon-ambience-mall-gurgaon` | 6 | hero.JPG |
| 63 | 63. Geetanjali Salon Ranchi Jharkhand | `geetanjali-salon-ranchi-jharkhand-2` | 6 | hero.JPG |
| 64 | 64. Geetanjali Studio Victory Valley Sector 67 Gurgaon | `geetanjali-studio-victory-valley-sector-67-gurgaon` | 9 | hero.JPG |
| 65 | 65. Geetanjali Salon Sector 11 Dwarka New Delhi | `geetanjali-salon-sector-11-dwarka-new-delhi` | 6 | hero.JPG |
| 66 | 66. Geetanjali Salon Pusa Road Karol Bagh New Delhi | `geetanjali-salon-pusa-road-karol-bagh-new-delhi` | 6 | hero.JPG |
| 67 | 67. Geetanjali Salon Vegas Mall Sector-14 Dwarka New Delhi | `geetanjali-salon-vegas-mall-sector-14-dwarka-new-delhi` | 11 | hero.jpg |
| 68 | 68. Geetanjali Salon Starling Mall Sector 104 Noida | `geetanjali-salon-starling-mall-sector-104-noida-u-p` | 8 | hero.JPG |
| 69 | 69. Geetanjali Salon Gaur City Mall Sector 4 Greater Noida | `geetanjali-salon-gaur-city-mall-sector-4-greater-noida-u-p` | 6 | hero.jpg |
| 70 | 70. Geetanjali Salon Elante Mall Chandigarh | `geetanjali-salon-elante-mall-chandigarh-2` | 6 | hero.jpg |
| 71 | 71. Geetanjali Salon Esplanade 1 Mall Rasulgarh Bhubaneswar | `geetanjali-salon-esplanade-1-mall-rasulgarh-bhubaneswar` | 5 | hero.jpg |
| 72 | 72. Geetanjali Studio Jayanti Mall Alwar Rajasthan | `geetanjali-studio-jayanti-mall-alwar-rajasthan` | 5 | hero.jpg |
| 73 | 73. Bon Temps Salon Saket New Delhi | `bon-temps-salon-saket-new-delhi` | 7 | hero.JPG |
| 74 | 74. Marc Zenat Slimming Systems IMT Manesar Gurgaon | `marc-zenat-slimming-systems-imt-manesar-gurgaon` | 8 | hero.jpg |
| 75 | 75. Tweak Salon Dlf Place Saket New Delhi | `tweak-salon-dlf-place-saket-new-delhi` | 6 | hero.jpg |
| 76 | 76. Geetanjali Salon R-14 C Scheme Jaipur Rajasthan | `geetanjali-salon-r-14-c-scheme-jaipur-rajasthan-2` | 7 | hero.jpg |
| 77 | 77. Geetanjali Salon Mukut House Amritsar Punjab | `geetanjali-salon-mukut-house-amritsar-punjab` | 8 | hero.JPG |
| 78 | 78. HOB Salon Janakpuri New Delhi | `hob-salon-janakpuri-new-delhi` | 7 | hero.jpg |
| 81 | 81. Ivory Room Salon & Spa Huda Market Sector 56 Gurgaon | `ivory-room-salon-and-spa-huda-market-sector-56-gurgaon` | 6 | hero.jpg |
| 82 | 82. Encanto Unisex Salon Nail Cafe Naraina Vihar New Delhi | `encanto-unisex-salon-nail-cafe-naraina-vihar-new-delhi` | 6 | hero.jpg |
| 83 | 83. Knuckout Unisex Salon N Spa Sector 8 Panchkula Haryana | `knuckout-unisex-salon-n-spa-sector-8-panchkula-haryana` | 6 | hero.jpg |
| 84 | 84. Geetanjali Studio Emaar Palm Hills Sector 77 Gurgaon | `geetanjali-studio-emaar-palm-hills-sector-77-gurgaon` | 3 | hero.jpg |
| 85 | 85. Geetanjali Studio Gardenia Glory Sector 46 Noida U.P | `geetanjali-studio-gardenia-glory-sector-46-noida-u-p` | 4 | hero.jpg |
| 86 | 86. Geetanjali Studio Model Town Rohtak Haryana | `geetanjali-studio-model-town-rohtak-haryana` | 4 | hero.jpg |
| 87 | 87. Extension Port Salon Fun Republic Mall Gomti Nagar Lucknow U.P | `extension-port-salon-fun-republic-mall-gomti-nagar-lucknow-u-p` | 3 | hero.jpg |
| 88 | 88. Geetanjali Studio Sapphire Ninety Sector 90 Gurgaon | `geetanjali-studio-sapphire-ninety-sector-90-gurgaon` | 5 | hero.jpg |
| 89 | 89. Geetanjali Studio PLA Market Hisar Haryana | `geetanjali-studio-pla-market-hisar-haryana` | 5 | hero.jpg |
| 90 | 90. Geetanjali Studio Gaur Central Mall RDC Raj Nagar Ghaziabad U.P | `geetanjali-studio-gaur-central-mall-rdc-ghaziabad-u-p` | 4 | hero.jpg |
| 91 | 91. Geetanjali Salon Vaishali Nagar Jaipur Rajasthan | `geetanjali-salon-vaishali-nagar-jaipur-rajasthan` | 8 | hero.JPG |
| 92 | 92. Bon Temps Salon One Skymark Tower E Sector 98 Noida U.P | `bon-temps-salon-sector-98-noida-u-p` | 7 | hero.jpg |
| 93 | 93. Geetanjali Salon DLF Cyber City Gurgaon | `geetanjali-salon-dlf-cyber-city-gurgaon` | 6 | hero.JPG |
| 94 | 94 Studio ESS Salon The Belaire Golf Course Road Sector 54 Gurgaon WM | `studio-ess-salon-the-belaire-golf-course-road-sector-54-gurgaon` | 5 | hero.JPG |
| 95 | 95. Geetanjali Salon Upper Ground Food Mall By Hush Sector-63 Noida U.P | `geetanjali-salon-food-mall-by-hush-sector-63-noida-u-p` | 6 | hero.jpg |
| 96 | 96. Geetanjali Salon Sector 21C Main Market Faridabad Haryana WM | `geetanjali-salon-sector-21c-main-market-faridabad-haryana` | 7 | hero.JPG |
| 97 | 97. Geetanjali Studio South City 1 Gurgaon WM | `geetanjali-studio-south-city-1-gurgaon` | 8 | hero.JPG |
| 98 | 98. Geetanjali Salon Genesis Boring Road Crossing Patna Bihar | `geetanjali-salon-genesis-boring-road-crossing-patna-bihar` | 7 | hero.jpeg |
| 99 | 99. Northwoodd Salon Rajouri Garden Extn New Delhi WM | `northwoodd-salon-rajouri-garden-extn-new-delhi` | 5 | hero.JPG |
| 101 | 101. Geetanjali Salon Ashiyana Lucknow U.P | `geetanjali-studio-ashiyana-lucknow-u-p` | 5 | hero.jpg |
| 112 | 112. Geetanjali Salon Khan Market New Delhi | `geetanjali-salon-khan-market-new-delhi` | 7 | 2.JPG |
| 113 | 113. Geetanjalo Salon Elante Mall Chandigarh | `geetanjali-salon-elante-mall-chandigarh` | 5 | hero.jpeg |
| 114 | 114. Geetanjali Studio Conscient One Sector 109 Gurgaon | `geetanjali-studio-conscient-one-sector-109-gurgaon` | 6 | hero.JPG |
| 115 | 115. Geetanjali Salon Lulu Mall Hariharpur Lucknow U.P | `geetanjali-salon-lulu-mall-hariharpur-lucknow-u-p` | 5 | hero.JPG |
| 117 | 117. Geetanjali Salon Model Town New Delhi | `geetanjali-salon-model-town-new-delhi` | 6 | hero.jpeg |
| 118 | 118. Geetanjali Salon GK 2 New Delhi | `geetanjali-salon-gk-2-new-delhi` | 6 | hero.JPG |
| 119 | 119. Geetanjali Salon Janakpuri New Delhi | `geetanjali-salon-janakpuri-new-delhi` | 7 | hero.JPG |
| 120 | 120 Geetanjali Salon & Academy Hauz Khas New Delhi | `geetanjali-salon-hauz-khas-new-delhi` | 6 | hero.JPG |
| 121 | 121 Geetanjali Studio Gulshan One29 Noida U.P | `geetanjali-studio-gulshan-one29-noida-u-p` | 7 | hero.JPG |
| 122 | 122 He & She Unisex Salon Gandhi Market Area Minto Road New Delhi | `he-and-she-unisex-salon-gandhi-market-area-minto-road-new-delhi` | 3 | hero.JPG |
| 124 | 124 Geetanjali Salon Shivalik Malviya Nagar New Delhi | `geetanjali-salon-shivalik-malviya-nagar-new-delhi` | 6 | hero.JPG |
| 129 | 129 Lakme Salon Lajpat Nagar Kanpur U.P | `lakme-salon-lajpat-nagar-kanpur-u-p` | 7 | hero.JPG |
| 130 | 130 Geetanjali Studio Sector 13 Vasundhara Ghaziabad U.P | `geetanjali-studio-sector-13-vasundhara-ghaziabad-u-p` | 6 | hero.JPG |
| 131 | 131 Geetanjali Salon Palladium Mall Ahmedabad Gujarat | `geetanjali-salon-palladium-mall-ahmedabad-gujarat` | 7 | hero.JPG |
| 132 | 132. Marc Zenat Slimming Systems Industrial Area Mohali Punjab | `marc-zenat-slimming-systems-mohali-punjab` | 21 | 1.JPG |
| 133 | 133 Geetanjali Studio Kidwai Nagar Kanpur U.P | `geetanjali-studio-kidwai-nagar-kanpur-u-p` | 21 | 1.JPG |
| 134 | 134 Geetanjali Salon M3M 65th Avenue Sector 65 Gurgaon | `geetanjali-salon-m3m-sector-65-gurgaon` | 8 | hero.jpeg |
| 135 | 135. Geetanjali Salon Sarti Nagar Janpath Shyam Nagar Jaipur Rajasthan | `geetanjali-salon-shyam-nagar-jaipur` | 6 | hero.JPG |
| 137 | 137 Geetanjali Studio Chandracharya Chowk Ranipur More Haridwar UK | `geetanjali-studio-ranipur-more-haridwar-uk` | 6 | hero.jpg |
| 138 | 138 Geetanjali Salon Civil Lines Bareilly U.P | `geetanjali-salon-civil-lines-bareilly` | 8 | hero.jpeg |
| 139 | 139. Geetanjali Studio Laxman Jhula Road Rishikesh UK | `geetanjali-studio-laxman-jhula-road-rishikesh-uk` | 8 | hero.jpg |
| 140 | 140. Geetanjali Salon Rajpur Road Dehradun UK | `geetanjali-salon-rajpur-road-dehradun-uk` | 8 | hero.jpg |
| 141 | 141. Geetanjali Salon Pune Maharashtra | `geetanjali-salon-pune-maharashtra` | 4 | hero.jpeg |
| 145 | 145. Geetanjali Salon Civil Lines Rudrapur UK | `geetanjali-salon-guru-maa-civil-lines-rudrapur-uttarakhand` | 8 | hero.JPG |
| 146 | 146. Geetanjali Salon Kankarbagh Patna Bihar | `geetanjali-salon-kankarbagh-patna-bihar` | 5 | hero.jpeg |
| 147 | 147. Geetanjali Studio Ambition Business Park Patna Bihar | `geetanjali-studio-ambition-business-park-patna-bihar` | 6 | hero.jpeg |
| 149 | 149. Tweak Salon DLF Promenade Mall Vasant Kunj New Delhi | `tweak-salon-promenade-mall-vasant-kunj-new-delhi` | 5 | hero.jpg |
| 150 | 150. Geetanjali Salon Address One Mall Malsi Dehradun UK | `geetanjali-salon-address-one-mall-dehradun-uttarakhand` | 10 | hero.jpg |
| 151 | 151. Geetanjali Salon AIPL Joy Central Sector 65 Gurgaon | `geetanjali-salon-aipl-sector-66-gurugram` | 7 | hero.jpg |
| 152 | 152. Geetanjali Salon Shivam Marbles Nanital Road Haldwani UK | `geetanjali-salon-haldwani-uttarakhand` | 10 | hero.JPG |
| 153 | 153. Geetanjali Studio DLF Mall of India Noida U.P | `geetanjali-studio-dlf-mall-of-india-noida-u-p` | 9 | hero.JPG |
| 154 | 154. Geetanjali Salon R-14 C Scheme Jaipur Rajasthan | `geetanjali-salon-r-14-c-scheme-jaipur-rajasthan` | 7 | hero.JPG |
| 155 | 155. Geetanjali Salon Mall of Dehradun Dehradun UK | `geetanjali-salon-mall-of-dehradun-dehradun-uk` | 6 | hero.JPG |
| 162 | 162. Geetanjali Salon Elan Miracle Sector 84 Gurgaon | `geetanjali-salon-elan-miracle-sector-84-gurgaon` | 9 | hero.JPG |
| 168 | 168. Looks Salon Gulshan One29 Noida U.P | `looks-salon-gulshan-one29-noida-u-p` | 6 | hero.jpeg |
| 174 | 174. Toni & Guy Salon Central Market Sector 120 Noida U.P | `tony-and-guy-salon-central-market-sector-120-noida-u-p` | 6 | hero.JPG |
| 179 | 179. Geetanjali Salon City Center Mall Guwahati Assam | `geetanjali-salon-guwahati-assam` | 6 | hero.jpeg |
| 184 | 184 Bellance Nail Art Zora Mall Raipur Chhattisgarh | `bellance-nail-art-zora-mall-raipur-chhasttisgarh` | 6 | hero.jpeg |
| 187 | 185. Fab U Salon Piru Vihar Delhi Cantt Delhi | `fab-u-salon-piru-vihar-sadar-bazar-delhi-cantt` | 18 | 1.JPG |

## List projects with no folder (21)

#106 Geetanjali Studio (Moradabad U.P); #110 Geetanjali Salon (Srinagar Jammu & Kashmir); #123 Geetanjali Salon (Phoenix Citadel Mall Indore M.P); #126 Geetanjali Salon (Gandhi Nagar Jammu Jammu & Kashmir); #127 Geetanjali Studio (Udhampur Jammu & Kashmir); #143 Geetanjali Salon (Mall Of Ranchi Kumhartoli Ranchi Jharkhand); #159 Geetanjali Studio (Conscient One Sector 109 Gurugram); #160 Geetanjali Salon (Dhanbad Jharkhand); #170 Geetanjali Salon (EC Road Dehradun Uttarakhand); #171 Krrish Provence Estate Gwal Pahari Gurgaon (); #177 Looks Salon (CP New Delhi); #178 Toni & Guy Salon (Cross Point Mall Gurgaon); #182 Geetanjali Studio (Alwar  Rajasthan); #183 Looks Salon (Alwar  Rajasthan); #185 Bellance Salon & Acedemy (Raipur Chhatisgarh); #186 RMR Nail Art Studio (Spaze Boulevard Sohna Road Gurgaon); #188 Bon Tamps Salon (M Block Market GK-2 New Delhi); #189 Bellance Salon (Apex  D'Rio Indirapuram Ghaziabad); #190 Big Boss Salon (Faridabad Sector 35); #191 Bellance Salon (M-19 GK-1 New Delhi); #192 Rawls Salon (Vista Square Mall Sec-82A Gurgaon)

