# The content pack — how to hand over project photographs and details

This describes the folder at **`C:\dev\sanity-import`**. Fill it in, hand it
back, and one command loads everything onto the website.

You do not need to understand the website to do this. You need to know your
projects.

---

## The short version

```
C:\dev\sanity-import\
   projects\
      001-esskay-beauty-resources\
      002-...
      ...
      192-rawls-salon-vista-square-mall\
   brands\
      geetanjali\
      bellance\
      ...
```

**One folder per project — all 192 already exist.** Inside each one:

| File | What it is |
|---|---|
| `hero.jpg` | The single best photograph. **Required** for the project to go live. |
| `01.jpg`, `02.jpg`, `03.jpg` … | More photographs, shown in that order |
| `before-01.jpg`, `before-02.jpg` … | Optional before/during shots |
| `details.txt` | The written details — already there, waiting to be filled in |
| `PHOTOS-HERE.txt` | A reminder of the above. Ignore it or delete it. |

That is the whole job: **drop photographs in, type into `details.txt`.**

---

## Five rules that matter

**1. Never change the number at the front of a folder name.**
`080-geetanjali-salon-phoenix-palassio-mall-lucknow` — the `080` is how the
website knows which project this is. The words after it are only there so you
can find the folder; rename those freely if a name is wrong. Change the number
and the photographs land on a different project.

**2. Photograph filenames must be exactly as above.**
`hero.jpg`, then `01.jpg`, `02.jpg`. Anything else is skipped and reported —
including `1.jpg`, which needs the leading zero. `.png` is fine too.

**3. Send the originals. Do not resize, compress or watermark anything.**
The import does all three itself, including the ACI watermark. A photograph
that has already been shrunk cannot be un-shrunk, so this is the one mistake
here that loses quality permanently.

**4. Leave anything you are not sure of blank.**
A blank field means "not known" and the website simply doesn't show it. A
guessed one becomes a published claim.

**5. `CONSENT: yes` is what makes a project go live.**
Without it the project is loaded but held back as a draft. That is deliberate —
it means nothing is published by accident.

---

## Filling in `details.txt`

Open it in Notepad. It looks like this — the notes at the top are for you, and
are ignored by the computer:

```
CONSENT: yes

SCOPE: Full fit-out including civil, electrical, furniture and signage.

CREDITS: Photographs by ...

OVERVIEW:
A mall unit on the second floor turned into a full-service salon floor,
with the wash area moved away from the shopfront.

CHALLENGE:
The landlord allowed no wet work after 8pm and the unit had one drain.

SOLUTION:
...

FEATURES:
- Twelve styling stations
- Custom brass and walnut reception desk
- Separate bridal room

TESTIMONIAL:
```

**Do not write notes between the fields.** Everything under a label is read as
that label's answer, so a stray line under `SCOPE:` becomes part of the scope. Short
answers go on the same line as the label; long ones go on the lines below it.

### What each field means

| Field | |
|---|---|
| `CONSENT` | `yes` or `no`. Has the client agreed to this being shown? |
| `SCOPE` | One line on what the job covered |
| `CREDITS` | Photographer, or anyone else to credit |
| `OVERVIEW` | A paragraph on the space and the brief |
| `CHALLENGE` | What made this site difficult — the problem, not the answer |
| `SOLUTION` | What you did about it |
| `FEATURES` | One `- item` per line |
| `TESTIMONIAL` | **The client's own words only.** Leave it blank otherwise. |

> On `TESTIMONIAL`: never write one on a client's behalf. It is the only entry
> in this pack that cannot be quietly corrected later — it is a quotation
> attributed to a real business.

---

## The `brands` folder

66 folders, one per brand, and **all of them are optional.** Add something only
if you have it:

| File | |
|---|---|
| `logo.png` | The brand's logo |
| `hero.jpg` | A photograph to head that brand's page |
| `description.txt` | A paragraph about the brand |
| `consent.txt` | **Only to withdraw permission.** Write `no` inside. |

An empty brand folder is fine and is the normal case. `consent.txt` exists to
take permission away — these brands are already named on the live site, so
leaving the folder empty means nothing changes.

---

## You do not have to do all 192 at once

Send them in batches — ten now, ten next week. Re-running the import **updates**
the projects it already loaded rather than creating duplicates, so a later batch
never disturbs an earlier one. Adding more photographs to a project you already
sent works the same way: drop them in, re-import, done.

---

## Checking your work (for whoever runs the import)

From the repo, with no Sanity credentials and no internet:

```
npm run sanity:import -- --dir C:\dev\sanity-import
```

This is a **dry run** — it writes nothing. It reports how many projects have a
hero image, how many have consent, how many will publish, and names every
folder with a problem. Run it after every batch; it is the cheapest place to
find a misnamed file.

When it looks right:

```
npm run sanity:import -- --dir C:\dev\sanity-import --apply
```

`--apply` needs `NEXT_PUBLIC_SANITY_PROJECT_ID` and `SANITY_WRITE_TOKEN` set in
`.env.local`.

### Before the first `--apply`

Three things are still outstanding and are not part of filling in this pack:

1. **No Sanity project exists yet.** One has to be created, and its ID, dataset
   and an Editor token put in `.env.local`.
2. **The repository's history should be rewritten first** — see the Deployment
   section of `CLAUDE.md`. Doing it after the migration is much harder.
3. Only `brand` and `project` documents have a schema. If the pack ever grows
   to cover team, services or testimonials, those schemas come first.

### Where the pack lives, and why not inside the project

`C:\dev\sanity-import` sits **next to** `C:\dev\arch`, not inside it. The pack
will hold something like 960 camera originals; the website's own repository is
already carrying 258 MB of exactly that kind of file from earlier years, and
anything placed inside it becomes permanent. Keep the pack outside.

---

## Regenerating the empty pack

If folders are ever lost, or projects are added to the list:

```
node sanity/scripts/scaffold.js            # shows what it would do
node sanity/scripts/scaffold.js --apply    # creates what is missing
```

It **never overwrites a `details.txt` that already exists**, so it is safe to
run against a pack you have started filling in.
