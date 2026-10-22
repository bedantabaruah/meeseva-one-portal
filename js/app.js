(function () {
  const CATALOGUE = window.MEESEVA_CATALOGUE
  const UI = window.MEESEVA_UI
  const LIFE_SERVICES_TOTAL = 396

  // one photo per life stage, the same set the current hero carousel uses
  // Wikimedia Commons: `path` is the file's hash folder (e.g. '8/87'); Commons serves 960 and 1280px thumbnails
  // every life-stage photo is a file under assets/photos (see js/photos.js)
  const photoPath = (key) => window.MEESEVA_PHOTOS[key]
  const unsplash = (id) => () => photoPath('u:' + id)
  const pexels = (id) => () => photoPath('p:' + id)
  const commons = (path, file) => () => photoPath('c:' + file)
  const STAGE = {
    A: { img: unsplash('1780329941563-866557aca9f7'), pos: 'center 30%', q: 'birth certificate' },
    B: { img: unsplash('1524069290683-0457abfe42c3'), pos: 'center 30%', q: 'scholarship' },
    C: { img: unsplash('1742485244548-8f2ccab4b6b3'), pos: '75% center', q: 'employment' },
    D: { img: unsplash('1657912230234-87f45165424d'), pos: '65% 30%', q: 'marriage' },
    E: { img: unsplash('1586618770443-e6f8167fca61'), pos: 'center 40%', q: 'property tax' },
    F: { img: unsplash('1694011772133-dc4b3ff3f24f'), pos: 'center', q: 'pahani' },
    G: { img: unsplash('1530507629858-e4977d30e9e0'), pos: '70% center', q: 'rythu' },
    H: { img: pexels(14558557), pos: 'center 35%', q: 'aarogyasri' },
    // by TG09Z, CC BY-SA 4.0: https://commons.wikimedia.org/wiki/File:TGSRTC_Electric_Metro_Express_Bus_3.jpg
    I: { img: commons('8/87', 'TGSRTC_Electric_Metro_Express_Bus_3.jpg'), pos: '30% 60%', q: 'driving licence', widths: [960, 1280] },
    // by Biswarup Ganguly, CC BY 3.0: https://commons.wikimedia.org/wiki/File:Fingerprint_Scan_-_Biometric_Data_Collection_-_Aadhaar_-_Kolkata_2015-03-18_3660.JPG
    J: { img: commons('0/0d', 'Fingerprint_Scan_-_Biometric_Data_Collection_-_Aadhaar_-_Kolkata_2015-03-18_3660.JPG'), pos: '44% 60%', q: 'caste certificate', widths: [960, 1280] },
    K: { img: unsplash('1697305593259-d96aa6ed0e14'), pos: '70% center', q: 'pension' },
    L: { img: pexels(35325989), pos: 'center 62%', q: 'excise' },
    M: { img: unsplash('1657981630164-769503f3a9a8'), pos: 'center 35%', q: 'tourism' },
    // by iMahesh, CC BY-SA 4.0: https://commons.wikimedia.org/wiki/File:High_Court_of_Telangana_in_Hyderabad.jpg
    N: { img: commons('3/3a', 'High_Court_of_Telangana_in_Hyderabad.jpg'), pos: '60% center', q: 'grievance', widths: [960, 1280] },
    O: { img: pexels(3934328), pos: '30% 35%', q: 'death certificate' },
  }
  /* ---------------------------------------------------- hero card photo cycle */
  // every 2.5s the Life Stage Categories card eases in the next life stage's photo over the
  // current one; each photo loads before it starts to appear
  const layers = document.querySelectorAll('#fade .fade-layer')
  const ORDER = Object.keys(STAGE)
  let showing = ORDER.indexOf('D') // starts on the family photo
  let front = 0 // which layer is on top
  let depth = 1
  const photo = (id) => { const st = STAGE[id]; return st.img(st.widths ? st.widths[1] : 1280) }
  function showNext() {
    if (document.hidden) return
    const id = ORDER[(showing + 1) % ORDER.length]
    const next = layers[1 - front]
    const pre = new Image()
    pre.onload = () => {
      const img = next.querySelector('img')
      img.src = pre.src
      img.style.objectPosition = STAGE[id].pos
      // restack the incoming layer on top, hidden, then let it ease in
      next.classList.remove('is-in')
      next.classList.add('is-entering')
      next.style.zIndex = String(++depth)
      void next.offsetWidth
      next.classList.replace('is-entering', 'is-in')
      showing = ORDER.indexOf(id)
      front = 1 - front
    }
    pre.src = photo(id)
  }
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) setInterval(showNext, 2500)

  const ARROW = '<svg class="arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M2 8h12M9 3l5 5-5 5"/></svg>'
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
  const liveCount = (c) => c.items.filter((i) => i[3]).length

  /* ---------------------------------------------------- preferences (saved per browser) */
  const read = (key, allowed, fallback) => {
    try { const v = localStorage.getItem(key); return allowed.includes(v) ? v : fallback } catch { return fallback }
  }
  const store = (key, v) => { try { localStorage.setItem(key, v) } catch { /* private mode */ } }

  /* ---------------------------------------------------- language */
  // the page's own labels that the app's dictionary doesn't have
  const EXTRA = {
    en: {
      'x.lifeStages': 'Life Stage Categories',
      'x.welcome': 'Welcome to MeeSeva One Portal',
      'x.heroTagline': 'One Portal, Every Service',
      'x.heroLede': 'Find everything you need for every stage of life, all in one place',
    },
    te: {
      'x.lifeStages': UI.te['hero.stat.stages'],
      'x.welcome': 'మీసేవ ఒకే పోర్టల్‌కు స్వాగతం',
      'x.heroTagline': `${UI.te['hero.titleA']} ${UI.te['hero.titleB']}`.replace(/\.$/, ''),
      'x.heroLede': UI.te['hero.subtitle'].replace(/\.$/, ''),
    },
  }
  let lang = read('meeseva-lang', ['en', 'te'], 'en')
  const t = (key, vars) => {
    let s = UI[lang][key] ?? EXTRA[lang][key] ?? UI.en[key] ?? EXTRA.en[key] ?? key
    for (const k in vars || {}) s = s.replaceAll(`{${k}}`, vars[k])
    return s
  }
  // category and service text, falling back to English where there's no translation
  const catName = (c) => (lang === 'te' && c.nameTe) || c.name
  const catTag = (c) => (lang === 'te' && c.tagTe) || c.tag
  const svc = (i) => ({
    event: (lang === 'te' && i[4]) || i[0],
    service: (lang === 'te' && i[5]) || i[1],
    dept: (lang === 'te' && i[6]) || i[2],
    live: i[3],
  })
  const svcCount = (n) => t(n === 1 ? 'cat.serviceOne' : 'cat.serviceMany', { n })

  /* ---------------------------------------------------- stats */
  const totalLive = CATALOGUE.reduce((n, c) => n + liveCount(c), 0)
  function renderStats() {
    document.getElementById('hero-stats').innerHTML = [
      [LIFE_SERVICES_TOTAL, 'hero.stat.services'],
      [CATALOGUE.length, 'hero.stat.stages'],
      [totalLive, 'hero.stat.online'],
      ['24×7', 'hero.stat.access'],
    ].map(([v, k]) => `<div class="stat"><dd><span class="sr-only">${v}</span><span class="roll" aria-hidden="true">${
      [...String(v)].map((c, i) => `<span class="ch" style="--i:${i}">${c}</span>`).join('')
    }</span></dd><dt>${t(k)}</dt></div>`).join('')
    startStatMotion()
  }

  // the KPIs roll in together each time the band scrolls into view, and reset (hidden
  // below) once it has scrolled away, ready to play again; nothing moves otherwise
  let statObserver = null
  function startStatMotion() {
    statObserver?.disconnect()
    const band = document.getElementById('hero-stats')
    const stats = [...band.querySelectorAll('.stat')]
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      stats.forEach((el) => el.classList.add('reset', 'in'))
      return
    }
    statObserver = new IntersectionObserver(([en]) => {
      if (en.isIntersecting) {
        stats.forEach((el) => el.classList.add('in'))
      } else {
        stats.forEach((el) => {
          el.classList.add('reset')
          el.classList.remove('in')
          void el.offsetWidth
          el.classList.remove('reset')
        })
      }
    }, { threshold: 0.5 })
    statObserver.observe(band)
  }

  /* ---------------------------------------------------- life-stage grid */
  function renderStages() {
    document.getElementById('stage-grid').innerHTML = CATALOGUE.map((c, idx) => {
      const s = STAGE[c.id]
      const [w1, w2] = s.widths || [640, 1000]
      return `<button class="tile stage" type="button" data-open-stage="${c.id}" aria-label="${esc(catName(c))}, ${svcCount(c.items.length)}">
        <img src="${s.img(w2)}" srcset="${s.img(w1)} ${w1}w, ${s.img(w2)} ${w2}w" sizes="(max-width: 860px) 50vw, (max-width: 1100px) 33vw, 20vw" alt="" loading="lazy" style="object-position:${s.pos}" />
        <span class="stage-top">${idx + 1}</span>
        <svg class="stage-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${c.icon}</svg>
        <span class="stage-bottom">
          <span class="tile-label">${esc(catName(c))}
            <span class="meta">${svcCount(c.items.length)}</span>
          </span>
          ${ARROW}
        </span>
      </button>`
    }).join('')
  }

  /* ---------------------------------------------------- drawer */
  const drawer = document.getElementById('drawer')
  const content = document.getElementById('drawer-content')
  let lastFocus = null
  let drawerView = null // re-rendered when the language changes

  function serviceRow(item, catLabel) {
    const { event, service, dept, live } = svc(item)
    return `<div class="svc">
      <div class="svc-text">
        <b>${esc(event)}</b>
        <span>${esc(service)}</span>
        <small>${catLabel ? esc(catLabel) + ' · ' : ''}${esc(dept)}</small>
      </div>
      <span class="chip ${live ? 'chip--live' : 'chip--soon'}">${t(live ? 'chip.available' : 'chip.soon')}</span>
    </div>`
  }

  function openDrawer(html, view) {
    drawerView = view
    content.innerHTML = html
    if (document.body.classList.contains('drawer-open')) return
    lastFocus = document.activeElement
    document.body.classList.add('drawer-open')
    drawer.setAttribute('aria-hidden', 'false')
    drawer.querySelector('.drawer-body').scrollTop = 0
    requestAnimationFrame(() => document.getElementById('drawer-close').focus())
  }
  function closeDrawer() {
    if (!document.body.classList.contains('drawer-open')) return
    drawerView = null
    document.body.classList.remove('drawer-open')
    drawer.setAttribute('aria-hidden', 'true')
    if (lastFocus) lastFocus.focus()
  }

  function openStage(id) {
    if (id === 'A') { if (location.hash.startsWith(BP_BASE)) routeBirth(); else location.hash = BP_BASE; return } // its own pages, see "birth & early childhood services"
    const c = CATALOGUE.find((x) => x.id === id)
    if (!c) return
    const s = STAGE[id]
    const live = c.items.filter((i) => i[3])
    const soon = c.items.filter((i) => !i[3])
    const band = (key, list) => list.length ? `<div class="band">
        <h3>${t(`band.${key}.title`)} <span style="color:var(--ink-3)">· ${list.length}</span></h3>
        <p class="band-sub">${t(`band.${key}.sub`)}</p>
        ${list.map((i) => serviceRow(i)).join('')}
      </div>` : ''
    openDrawer(`
      <div class="drawer-media">
        <img src="${s.img(s.widths ? s.widths[1] : 1280)}" alt="" style="object-position:${s.pos}" />
        <div>
          <p class="eyebrow">${c.id} · ${svcCount(c.items.length)}</p>
          <h2 class="display" id="drawer-title">${esc(catName(c))}</h2>
        </div>
      </div>
      <div class="drawer-body">
        <p class="drawer-tag">${esc(catTag(c))}</p>
        ${band('available', live)}
        ${band('soon', soon)}
      </div>`, () => openStage(id))
  }

  function openSearch(query) {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return
    const hits = []
    for (const c of CATALOGUE) for (const i of c.items) {
      // English and Telugu text both match, whichever language is showing
      if (i.slice(0, 3).concat(i.slice(4)).join(' ').toLowerCase().includes(q)) hits.push([i, `${c.id}. ${catName(c)}`])
    }
    hits.sort((a, b) => b[0][3] - a[0][3])
    openDrawer(`
      <div class="drawer-media drawer-media--plain">
        <div>
          <p class="eyebrow">${t('hero.searchLabel')}</p>
          <h2 class="display" id="drawer-title">${esc(t(hits.length === 1 ? 'cat.resultFor' : 'cat.resultsFor', { n: hits.length, q: query.trim() }))}</h2>
        </div>
      </div>
      <div class="drawer-body">
        ${hits.length
          ? `<div class="band">${hits.slice(0, 60).map(([i, cat]) => serviceRow(i, cat)).join('')}</div>`
          : `<div class="no-match"><b>${t('cat.noMatch.title')}</b><span>${t('cat.noMatch')}</span></div>`}
      </div>`, () => openSearch(query))
  }

  /* ---------------------------------------------------- birth & early childhood services (life stage A) */
  // After the Aadhaar login, life stage A opens as its own pages (hash routes under #/services/A), following the
  // app's approved flow: find the birth record (search by details: district -> details -> results, or by
  // acknowledgement number) -> select a service -> application form -> payment -> acknowledgement.
  // It runs in the browser on the sample records below; applications are kept in this browser's localStorage
  // and nothing is sent anywhere.
  Object.assign(EXTRA.en, {
    'bp.demoFill': 'Fill sample data', 'bp.demoFilled': 'Sample data filled — check it, then continue.',
    'bp.home': 'Home', 'bp.lifeServices': 'Life Services', 'bp.searchByDetails': 'Search by Details',
    'bp.stepOf': 'Step {n} of {total}', 'bp.step.find': 'Find record', 'bp.step.service': 'Select service', 'bp.step.apply': 'Application',
    'bp.step.district': 'Select District', 'bp.step.details': 'Enter Details', 'bp.step.results': 'Search Results',
    'bp.find.title': 'Find your birth record',
    'bp.find.desc': 'Search by registration details, or skip straight to a non-availability certificate if no record exists.',
    'bp.mode.details': 'Search by Details', 'bp.mode.detailsDesc': 'Provide the registration details below to search for your certificate.',
    'bp.mode.nac': 'Non-Availability Certificate', 'bp.mode.nacDesc': 'Skip the search — get a certificate confirming no birth record exists for this child.',
    'bp.district.h': '1. Select District', 'bp.district.p': 'Select the district where the birth was registered.',
    'bp.f.district': 'District', 'bp.f.districtPh': 'Select District', 'bp.next': 'Next', 'bp.err.district': 'Select the district to continue.',
    'bp.ack.h': 'Search by Acknowledgement Number', 'bp.ack.p': 'Already have an acknowledgement number? Search with it directly instead.',
    'bp.ack.label': 'Acknowledgement number', 'bp.ack.ph': 'e.g. 1202436100421', 'bp.ack.search': 'Search',
    'bp.err.ack': 'Enter a valid 13-digit acknowledgement number.', 'bp.or': 'OR',
    'bp.details.h': 'Birth Details', 'bp.f.dob': 'Date of Birth', 'bp.f.circle': 'Circle/Area', 'bp.f.circlePh': 'Select Circle / Area',
    'bp.f.gender': 'Gender', 'bp.f.genderPh': 'Select Gender', 'bp.f.regNo': 'Registration No.', 'bp.f.optional': 'Enter if available',
    'bp.f.regNoNote': 'Not used to narrow a GHMC search yet — only Circle/Area, Date of Birth, Gender and the parents’ names are.',
    'bp.f.mother': 'Mother Name', 'bp.f.father': 'Father Name', 'bp.f.locationType': 'Location Type', 'bp.f.locationTypePh': 'Select Location Type',
    'bp.f.office': 'Registration Office/Unit', 'bp.f.officePh': 'Select Registration Office / Unit', 'bp.f.officeFirst': 'Select Location Type first',
    'bp.f.regYear': 'Registration Year', 'bp.f.regYearPh': 'Select Year', 'bp.f.select': 'Select',
    'bp.mandatory': 'Fields marked with * are mandatory.', 'bp.changeDistrict': 'Change District/Location', 'bp.clear': 'Clear Details',
    'bp.searchCta': 'Search Birth Record', 'bp.err.ghmc': 'Fill in Date of Birth, Circle/Area and Gender to search.',
    'bp.err.cdma': 'Fill in Location Type, Registration Office/Unit, Gender and Registration Year to search.',
    'bp.err.future': 'Date of birth cannot be in the future.',
    'bp.demo': 'Prototype data: every search lists sample records for the details entered. To see the no-record route, add a mother’s name that doesn’t match (for example “Xyz”). Acknowledgement no. 1202436100421 also works.',
    'bp.g.M': 'Male', 'bp.g.F': 'Female', 'bp.g.T': 'Transgender',
    'bp.res.h': 'Matching Birth Records', 'bp.res.p': '{n} record(s) matched your search. Select the correct one to continue.',
    'bp.res.back': 'Back to search', 'bp.res.circle': 'Circle No.', 'bp.res.dob': 'Date of Birth', 'bp.res.gender': 'Gender',
    'bp.res.district': 'District', 'bp.res.locationType': 'Location Type', 'bp.res.regYear': 'Registration Year',
    'bp.col.ack': 'Acknowledgement No.', 'bp.col.child': 'Child Name', 'bp.col.parents': 'Parent’s Name', 'bp.col.hospital': 'Hospital',
    'bp.col.officer': 'Officer Name', 'bp.col.dob': 'Date of Birth', 'bp.col.gender': 'Gender', 'bp.col.location': 'Location', 'bp.col.reg': 'Reg. No. / Year',
    'bp.view': 'View Details', 'bp.unnamed': 'Not named yet', 'bp.unnamedTip': 'Add the child’s name (Child Name Inclusion service)',
    'bp.chip.services': '{n} services', 'bp.chip.avail': '{n} available for you', 'bp.chip.soon': '{n} coming soon',
    'bp.found': 'Record found for', 'bp.notFound': 'No registered birth record found — showing the non-availability certificate',
    'bp.searchAgain': 'Search again', 'bp.rec.h': 'Record Details', 'bp.ackShort': 'Ack',
    'bp.r.ack': 'Acknowledgement No.', 'bp.r.reg': 'Registration No. / Year', 'bp.r.regDate': 'Registration Date', 'bp.r.child': 'Child’s Name',
    'bp.r.dob': 'Date of Birth', 'bp.r.gender': 'Gender', 'bp.r.mother': 'Mother’s Name', 'bp.r.father': 'Father’s Name', 'bp.r.hospital': 'Hospital',
    'bp.r.unit': 'Registration Unit', 'bp.r.district': 'District', 'bp.r.address': 'Address at Birth', 'bp.r.officer': 'Officer Name',
    'bp.s.cert': 'Birth Certificate', 'bp.s.certDesc': 'Get a certified copy of an existing birth record.',
    'bp.s.name': 'Child name inclusion in birth register', 'bp.s.nameDesc': 'Add your child’s name to the birth register after registration.',
    'bp.s.nameDone': 'The child’s name is already on this record.',
    'bp.s.corr': 'Correction in birth record', 'bp.s.corrDesc': 'Request a correction to the details in a birth certificate.',
    'bp.s.nac': 'Non-availability certificate (birth)', 'bp.s.nacDesc': 'Get official proof that no birth record exists for this child.',
    'bp.fees': 'Fees and timelines shown are indicative for this prototype.', 'bp.instant': 'Issued instantly', 'bp.days': 'Issued in {n} working days',
    'bp.form.instr': 'Important instructions:', 'bp.form.instr1': 'Fields marked * are mandatory.',
    'bp.form.instr2': 'The details section is printed on the certificate exactly as entered — check the spelling before you pay.',
    'bp.sec.applicant': 'Applicant Details', 'bp.sec.record': 'Birth Record', 'bp.sec.certDetails': 'Certificate Details',
    'bp.sec.nacDetails': 'Details', 'bp.sec.nacDetailsNote': '(the following details will be displayed in the certificate)',
    'bp.sec.lrbd': 'LRBD Service Specific Details', 'bp.sec.lrbdNote': '(where the birth happened)', 'bp.sec.ghmc': 'GHMC Certificate Details',
    'bp.sec.name': 'Child’s Name to be Included', 'bp.sec.corr': 'Correction Requested', 'bp.sec.doc': 'Supporting Document',
    'bp.a.serviceType': 'Service Type', 'bp.a.appNo': 'Application Number', 'bp.a.aadhaar': 'Aadhaar No', 'bp.a.name': 'Applicant Name',
    'bp.a.relation': 'Relation', 'bp.a.relationName': 'Name of the relation', 'bp.a.mobile': 'Mobile No', 'bp.a.email': 'Email ID', 'bp.a.address': 'Address',
    'bp.a.pincode': 'Pincode', 'bp.a.charsLeft': '{n} characters remaining', 'bp.a.ward': 'Ward', 'bp.a.locality': 'Locality',
    'bp.a.motherUid': 'Mother Aadhaar No (UID)', 'bp.a.fatherUid': 'Father Aadhaar No (UID)', 'bp.a.parentsAddress': 'Address of the parents at the time of birth of the child',
    'bp.a.residence': 'Residence Address', 'bp.a.delivery': 'Delivery Type', 'bp.a.mandal': 'Mandal/Circle', 'bp.a.village': 'Village / Ward',
    'bp.a.purpose': 'Purpose', 'bp.a.copies': 'No of Copies', 'bp.a.childFirst': 'Child’s First Name', 'bp.a.childSur': 'Surname',
    'bp.a.field': 'Detail to correct', 'bp.a.current': 'As recorded now', 'bp.a.corrected': 'Correct value', 'bp.a.reason': 'Reason for the correction',
    'bp.a.doc': 'Upload document', 'bp.a.docHint': 'PDF, JPG or PNG, up to 2 MB. In this prototype the file stays on your device.',
    'bp.a.docName': 'School record, affidavit or hospital discharge summary', 'bp.a.docCorr': 'Proof of the correct detail (hospital record, school certificate)', 'bp.a.docNac': 'Notarised affidavit about the birth',
    'bp.a.selected': 'Selected: {f}', 'bp.a.declare': 'I declare that the information given above is true to the best of my knowledge, and I understand that a false declaration is an offence.',
    'bp.a.showPayment': 'Show Payment', 'bp.a.back': 'Back',
    'bp.pay.h': 'Payment', 'bp.pay.fee': '{s} fee', 'bp.pay.perCopy': '₹{f} × {n}', 'bp.pay.user': 'MeeSeva user charges', 'bp.pay.total': 'Total payable',
    'bp.pay.mode': 'Pay with', 'bp.pay.upi': 'UPI', 'bp.pay.card': 'Debit / credit card', 'bp.pay.net': 'Net banking',
    'bp.pay.cta': 'Pay ₹{n} & Submit', 'bp.pay.busy': 'Processing payment…', 'bp.pay.edit': 'Edit details',
    'bp.err.required': 'This field is required.', 'bp.err.letters': 'Use letters only.', 'bp.err.mobile': 'Enter a valid 10-digit mobile number.',
    'bp.err.email': 'Enter a valid email address.', 'bp.err.pincode': 'Enter a valid 6-digit Telangana pincode (starts with 5).',
    'bp.err.uid': 'Enter a 12-digit Aadhaar number.', 'bp.err.copies': 'Enter between 1 and 10 copies.', 'bp.err.declare': 'Please accept the declaration.',
    'bp.err.doc': 'Attach a PDF, JPG or PNG file.', 'bp.err.docSize': 'The file must be 2 MB or smaller.',
    'bp.err.same': 'The correct value must be different from what is recorded now.', 'bp.err.long': 'Keep this under {n} characters.',
    'bp.err.fix': 'Some details need your attention — see the highlighted fields.',
    'bp.done.h': 'Application submitted', 'bp.done.hCert': 'Certificate issued', 'bp.done.p': 'Keep your application number to track this request.',
    'bp.d.service': 'Service', 'bp.d.no': 'Application No.', 'bp.d.applicant': 'Applicant', 'bp.d.child': 'Child', 'bp.d.record': 'Linked record',
    'bp.d.paid': 'Amount paid', 'bp.d.mode': 'Paid with', 'bp.d.on': 'Submitted on', 'bp.d.by': 'Expected by', 'bp.d.status': 'Status',
    'bp.st.submitted': 'Submitted', 'bp.st.issued': 'Issued',
    'bp.done.print': 'Print acknowledgement', 'bp.done.cert': 'View certificate', 'bp.done.back': 'Back to Birth & early childhood',
    'bp.cert.print': 'Print / save as PDF', 'bp.notfound.h': 'Application not found', 'bp.notfound.p': 'It may have been withdrawn, or it was made in another browser.',
    'bp.apps.h': 'Your applications', 'bp.apps.p': 'Applications made from this browser for this Aadhaar number.',
    'bp.apps.view': 'View', 'bp.apps.withdraw': 'Withdraw', 'bp.apps.remove': 'Remove', 'bp.apps.confirm': 'Withdraw application {no}? This cannot be undone.',
  })

  // Sample (fictional) records standing in for the GHMC and municipal (CDMA) birth registers.
  const BIRTH_RECORDS = [
    { ack: '1202436100421', regNo: 'B/2024/24/01873', regYear: '2024', regDate: '2024-03-19', district: 'HYDERABAD', circle: '24 - Kukatpally',
      dob: '2024-03-12', gender: 'F', child: 'Sri Lakshmi', surname: 'Gaddam', mother: 'Gaddam Anusha', father: 'Gaddam Ravi Kumar',
      hospital: 'Sunrise Mother & Child Hospital', officer: 'Dr. K. Sunitha', address: 'H.No. 4-21, KPHB Colony, Kukatpally, Hyderabad' },
    { ack: '1202436100437', regNo: 'B/2024/24/01881', regYear: '2024', regDate: '2024-03-20', district: 'HYDERABAD', circle: '24 - Kukatpally',
      dob: '2024-03-12', gender: 'F', child: 'Harshini', surname: 'Bandi', mother: 'Bandi Swathi', father: 'Bandi Naresh',
      hospital: 'Area Hospital, Kukatpally', officer: 'Dr. K. Sunitha', address: 'Flat 302, Vasanth Nagar, Kukatpally, Hyderabad' },
    { ack: '1202436100452', regNo: 'B/2024/24/01895', regYear: '2024', regDate: '2024-03-21', district: 'HYDERABAD', circle: '24 - Kukatpally',
      dob: '2024-03-12', gender: 'F', child: '', surname: 'Shaik', mother: 'Shaik Rubina', father: 'Shaik Azeez',
      hospital: 'Area Hospital, Kukatpally', officer: 'Sri M. Ramesh', address: '9-87, Moosapet Main Road, Hyderabad' },
    { ack: '1202436100468', regNo: 'B/2024/24/01902', regYear: '2024', regDate: '2024-03-22', district: 'HYDERABAD', circle: '24 - Kukatpally',
      dob: '2024-03-12', gender: 'F', child: 'Ananya', surname: 'Pothula', mother: 'Pothula Keerthi', father: 'Pothula Vamshi',
      hospital: 'Lifeline Women’s Hospital', officer: 'Sri M. Ramesh', address: 'Plot 77, Allwyn Colony, Kukatpally, Hyderabad' },
    { ack: '1202436100512', regNo: 'B/2024/9/00942', regYear: '2024', regDate: '2024-03-15', district: 'HYDERABAD', circle: '9 - Charminar',
      dob: '2024-03-12', gender: 'M', child: '', surname: 'Mohammed', mother: 'Ayesha Begum', father: 'Mohammed Imran',
      hospital: 'Government Maternity Hospital, Petlaburj', officer: 'Dr. S. Farheen', address: '22-1-415, Shah Gunj, Charminar, Hyderabad' },
    { ack: '1202536100088', regNo: 'B/2025/29/00031', regYear: '2025', regDate: '2025-01-14', district: 'HYDERABAD', circle: '29 - Secunderabad',
      dob: '2025-01-08', gender: 'F', child: '', surname: 'Nallamothu', mother: 'Nallamothu Pavani', father: 'Nallamothu Srinivas',
      hospital: 'Lotus Hospital', officer: 'Dr. P. Madhavi', address: '10-3-77, West Marredpally, Secunderabad' },
    { ack: '1203236200214', regNo: 'B/2023/GWMC/02215', regYear: '2023', regDate: '2023-07-26', district: 'WARANGAL', type: 'Municipal Corporation',
      office: 'Greater Warangal Municipal Corporation', dob: '2023-07-19', gender: 'M', child: 'Arjun', surname: 'Kodati', mother: 'Kodati Sravani',
      father: 'Kodati Mahesh', hospital: 'Government Maternity Hospital, Hanumakonda', officer: 'Sri B. Venkanna', address: '2-7-145, Subedari, Hanumakonda' },
    { ack: '1201836200763', regNo: 'B/2022/KMC/01407', regYear: '2022', regDate: '2022-11-09', district: 'KARIMNAGAR', type: 'Municipal Corporation',
      office: 'Karimnagar Municipal Corporation', dob: '2022-11-02', gender: 'F', child: 'Varshitha', surname: 'Eeda', mother: 'Eeda Lavanya',
      father: 'Eeda Santosh', hospital: 'District Hospital, Karimnagar', officer: 'Smt. G. Rajitha', address: '3-5-62, Mukarampura, Karimnagar' },
    { ack: '1202936300119', regNo: 'B/2024/NLG/00388', regYear: '2024', regDate: '2024-06-06', district: 'NALGONDA', type: 'Municipality',
      office: 'Nalgonda Municipality', dob: '2024-05-30', gender: 'M', child: 'Sai Charan', surname: 'Rapolu', mother: 'Rapolu Divya',
      father: 'Rapolu Venkatesh', hospital: 'Area Hospital, Nalgonda', officer: 'Sri D. Yadagiri', address: '6-2-31, Ramagiri, Nalgonda' },
    { ack: '1203336300402', regNo: 'B/2025/SDN/00117', regYear: '2025', regDate: '2025-02-11', district: 'RANGA REDDY', type: 'Municipality',
      office: 'Shadnagar Municipality', dob: '2025-02-03', gender: 'F', child: '', surname: 'Kummari', mother: 'Kummari Sunitha',
      father: 'Kummari Yadaiah', hospital: 'Community Health Centre, Shadnagar', officer: 'Smt. A. Swapna', address: '1-4-9, Vijaynagar Colony, Shadnagar' },
  ]
  const BP_DISTRICTS = ['ADILABAD', 'BHADRADRI KOTHAGUDEM', 'HANUMAKONDA', 'HYDERABAD', 'JAGITHYAL', 'JANGAON', 'JAYASHANKAR BHUPALPALLY', 'JOGULAMBA GADWAL',
    'KAMAREDDY', 'KARIMNAGAR', 'KHAMMAM', 'KUMURAM BHEEM (ASIFABAD)', 'MAHABUBABAD', 'MAHABUBNAGAR', 'MANCHERIAL', 'MEDAK', 'MEDCHAL-MALKAJGIRI', 'MULUGU',
    'NAGARKURNOOL', 'NALGONDA', 'NARAYANPET', 'NIRMAL', 'NIZAMABAD', 'PEDDAPALLI', 'RAJANNA SIRCILLA', 'RANGA REDDY', 'SANGAREDDY', 'SIDDIPET', 'SURYAPET',
    'VIKARABAD', 'WANAPARTHY', 'WARANGAL', 'YADADRI BHUVANAGIRI']
  const BP_CIRCLES = ['1 - Kapra', '2 - Uppal', '3 - Hayathnagar', '4 - LB Nagar', '5 - Saroornagar', '6 - Malakpet', '7 - Santosh Nagar', '8 - Chandrayangutta',
    '9 - Charminar', '10 - Falaknuma', '11 - Rajendranagar', '12 - Mehdipatnam', '13 - Karwan', '14 - Goshamahal', '15 - Musheerabad', '16 - Amberpet',
    '17 - Khairatabad', '18 - Jubilee Hills', '19 - Yousufguda', '20 - Serilingampally', '21 - Chandanagar', '22 - Patancheru', '23 - Moosapet',
    '24 - Kukatpally', '25 - Quthbullapur', '26 - Gajularamaram', '27 - Alwal', '28 - Malkajgiri', '29 - Secunderabad', '30 - Begumpet']
  const BP_LOCATION_TYPES = ['Municipal Corporation', 'Municipality', 'Gram Panchayat']
  const titleCase = (s) => s.toLowerCase().replace(/(^|[\s(-])(\w)/g, (m, a, b) => a + b.toUpperCase())
  const BP_OFFICES = {
    'WARANGAL|Municipal Corporation': ['Greater Warangal Municipal Corporation'],
    'RANGA REDDY|Municipality': ['Ibrahimpatnam Municipality', 'Shadnagar Municipality', 'Shamshabad Municipality'],
  }
  const bpOffices = (district, type) => BP_OFFICES[`${district}|${type}`] ?? (!type ? [] : [`${titleCase(district).replace(/ \(.*\)/, '')} ${type === 'Gram Panchayat' ? 'Rural (Gram Panchayats)' : type}`])
  // wards and localities for the NAC form: illustrative names derived from the chosen circle
  const bpWards = (circle) => { const n = Number(circle.split(' - ')[0]) || 1; return [0, 1, 2, 3].map((i) => `Ward ${(n - 1) * 5 + i + 1}`) }
  const bpLocalities = (circle) => { const name = circle.split(' - ')[1] || ''; return ['Colony', 'Nagar', 'Main Road', 'Basti'].map((s) => `${name} ${s}`) }
  const bpMandals = (district) => { const d = titleCase(district); return [`${d} Urban`, `${d} Rural`] }
  const bpVillages = (mandal) => [1, 2, 3, 4].map((i) => `${mandal.replace(/ (Urban|Rural)$/, '')} ${/Rural$/.test(mandal) ? 'Village' : 'Ward'} ${i}`)
  // fee per copy / per application in rupees, working days to issue (0 = instant)
  const BP_SERVICES = {
    cert: { title: 'bp.s.cert', desc: 'bp.s.certDesc', fee: 35, days: 0, code: 'BC' },
    name: { title: 'bp.s.name', desc: 'bp.s.nameDesc', fee: 50, days: 7, code: 'NI' },
    corr: { title: 'bp.s.corr', desc: 'bp.s.corrDesc', fee: 100, days: 15, code: 'BR' },
    nac: { title: 'bp.s.nac', desc: 'bp.s.nacDesc', fee: 50, days: 15, code: 'NA' },
  }
  const BP_USER_CHARGES = 25
  const BP_CORRECTABLE = ['child', 'dob', 'gender', 'mother', 'father', 'address']
  const BP_GENDERS = ['M', 'F', 'T']
  const BP_BASE = '#/services/A'

  // The rest of the prototype register: any search returns a stable set of sample records for that circle or
  // office, date or year and gender (seeded by the search, so the same search always lists the same children).
  const BP_FAMILIES = [
    { weight: 0.75, surnames: ['Gaddam', 'Bandi', 'Pothula', 'Rapolu', 'Kodati', 'Eeda', 'Nallamothu', 'Korupoju', 'Kancharla', 'Cheruku', 'Boddu', 'Mekala', 'Thota', 'Vemula', 'Pallerla', 'Gundu'],
      girls: ['Ananya', 'Harshini', 'Keerthana', 'Sahasra', 'Aaradhya', 'Hansika', 'Manasvi', 'Navya', 'Pranavi', 'Sanvi', 'Tejaswini', 'Rithika', 'Vaishnavi', 'Krithya', 'Hanvika Devi'],
      boys: ['Arjun', 'Sai Charan', 'Vihaan', 'Advik', 'Rudra', 'Vivaan', 'Nithin', 'Rishi', 'Yashwanth', 'Abhiram', 'Krishiv', 'Shanmukh', 'Aarav', 'Dhruv', 'Karthikeya'],
      mothers: ['Anusha', 'Swathi', 'Keerthi', 'Divya', 'Sravani', 'Lavanya', 'Pavani', 'Sunitha', 'Akshara', 'Chandrika', 'Madhavi', 'Haritha', 'Sowmya', 'Bhavani', 'Maheshwari'],
      fathers: ['Ravi Kumar', 'Naresh', 'Vamshi', 'Venkatesh', 'Mahesh', 'Santosh', 'Srinivas', 'Anil Kumar', 'Naveen Kumar', 'Praveen', 'Ramesh', 'Shekhar', 'Kiran', 'Suresh', 'Raju'] },
    { weight: 0.25, surnames: ['Mohammed', 'Shaik', 'Syed', 'Khan', 'Mirza', 'Siddiqui'],
      girls: ['Samaira', 'Iram', 'Ayesha', 'Zoya', 'Hurain', 'Mahira', 'Inaya', 'Alina', 'Sidra', 'Anaya'],
      boys: ['Ayaan', 'Arham', 'Rayan', 'Zaid', 'Ibrahim', 'Rehan', 'Faiz', 'Umar', 'Adnan', 'Huzaif'],
      mothers: ['Fahmeeda', 'Shaista', 'Sadiya', 'Anjum', 'Rubina', 'Farheen', 'Nazia', 'Shabana', 'Tabassum', 'Heena'],
      fathers: ['Khaleel', 'Moiz Uddin', 'Ghouse', 'Hussain', 'Azeez', 'Imran', 'Saleem', 'Irfan', 'Javeed', 'Asif'] },
  ]
  const BP_HOSPITALS = ['Area Hospital, {area}', 'Government Maternity Hospital, {area}', 'Urban Primary Health Centre, {area}', 'Sunrise Mother & Child Hospital',
    'Lifeline Women’s Hospital', 'Cradle Care Hospital', 'Matrix Maternity Centre', 'Sanjeevani Children’s Hospital', 'Navajeevan Nursing Home', 'Amma Hospital, {area}']
  const BP_OFFICERS = ['Dr. K. Sunitha', 'Sri M. Ramesh', 'Dr. S. Farheen', 'Dr. P. Madhavi', 'Sri T. Dasharath', 'Dr. B. L. Chakrapani', 'Smt. G. Rajitha', 'Sri D. Yadagiri']
  const BP_STREETS = ['Main Road', 'Colony', 'Nagar', 'Bazaar Street', 'Station Road', 'Ganesh Nagar', 'Indira Nagar', 'Teachers Colony']
  function bpRng(seedText) {
    let h = 1779033703 ^ seedText.length
    for (const ch of seedText) { h = Math.imul(h ^ ch.charCodeAt(0), 3432918353); h = (h << 13) | (h >>> 19) }
    let a = h >>> 0
    return () => { a = (a + 0x6D2B79F5) | 0; let x = Math.imul(a ^ (a >>> 15), 1 | a); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296 }
  }
  function bpGenerate({ district, circle = '', type = '', office = '', dob = '', regYear = '', gender, regNo = '' }) {
    const rnd = bpRng([district, circle, type, office, dob, regYear, gender, regNo].join('|'))
    const pick = (list) => list[Math.floor(rnd() * list.length)]
    const num = (n, width) => String(Math.floor(rnd() * n)).padStart(width, '0')
    const ghmc = district === 'HYDERABAD'
    const unitNo = ghmc ? circle.split(' - ')[0] : String(BP_DISTRICTS.indexOf(district) + 1)
    const area = ghmc ? circle.split(' - ')[1] : titleCase(district).replace(/ \(.*\)/, '')
    const latest = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10)
    const count = regNo ? 1 : 6 + Math.floor(rnd() * 9)
    const records = []
    for (let i = 0; i < count; i++) {
      let birth = dob || `${regYear}-${num(12, 2).replace(/^(\d)(\d)$/, (m) => String(Number(m) + 1).padStart(2, '0'))}-${String(1 + Math.floor(rnd() * 28)).padStart(2, '0')}`
      if (birth > latest) birth = latest
      const year = birth.slice(0, 4)
      const fam = rnd() < BP_FAMILIES[0].weight ? BP_FAMILIES[0] : BP_FAMILIES[1]
      const surname = pick(fam.surnames)
      const registered = new Date(`${birth}T00:00:00`)
      registered.setDate(registered.getDate() + 3 + Math.floor(rnd() * 18))
      records.push({
        ack: `12${year.slice(2)}${unitNo.padStart(2, '0')}${num(1e7, 7)}`,
        regNo: regNo || `B/${year}/${ghmc ? unitNo : district.replace(/[^A-Z]/g, '').slice(0, 3)}/${num(1e5, 5)}`,
        regYear: regYear || year, regDate: registered.toISOString().slice(0, 10), district, ...(ghmc ? { circle } : { type, office }),
        dob: birth, gender, child: rnd() < 0.15 ? '' : pick(gender === 'M' ? fam.boys : fam.girls), surname,
        mother: `${surname} ${pick(fam.mothers)}`, father: `${surname} ${pick(fam.fathers)}`,
        hospital: pick(BP_HOSPITALS).replace('{area}', area), officer: pick(BP_OFFICERS),
        address: `${1 + Math.floor(rnd() * 20)}-${1 + Math.floor(rnd() * 9)}-${1 + Math.floor(rnd() * 400)}, ${pick(BP_STREETS)}, ${area}${ghmc ? ', Hyderabad' : ''}`,
      })
    }
    return records
  }

  const BP_ICON = {
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    fileQ: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 10.3c.2-.4.5-.8.9-1a2.1 2.1 0 0 1 2.6.4c.3.4.5.8.5 1.3 0 1.3-2 2-2 2"/><path d="M12 17h.01"/>',
    eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    left: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    upRight: '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    chev: '<path d="m6 9 6 6 6-6"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    wand: '<path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/>',
  }
  const bpSvg = (name, size = 16, extra = '') => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${BP_ICON[name]}</svg>`

  /* ---- small helpers */
  const bpCat = () => CATALOGUE.find((x) => x.id === 'A')
  const bpToday = () => new Date().toISOString().slice(0, 10)
  const bpDate = (iso) => (iso ? new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-')
  const bpDateDash = (iso) => bpDate(iso).replace(/ /g, '-')
  const bpGender = (g) => (g ? t(`bp.g.${g}`) : '-')
  const bpChild = (r) => (r.child ? `${r.child} ${r.surname}` : '')
  const bpUnit = (r) => (r.circle ? `${r.circle.split(' - ')[1]} (GHMC Circle ${r.circle.split(' - ')[0]})` : `${r.office} (${r.type})`)
  const bpRecord = (ack) => BIRTH_RECORDS.find((r) => r.ack === ack) ?? (bpState.generated || []).find((r) => r.ack === ack) ?? null
  const bpAadhaar4 = () => { try { return sessionStorage.getItem('meeseva-demo-aadhaar4') || '' } catch { return '' } }
  const bpAppsKey = () => `meeseva-birth-applications-${bpAadhaar4() || 'guest'}`
  const loadBirthApps = () => { try { return JSON.parse(localStorage.getItem(bpAppsKey())) || [] } catch { return [] } }
  const saveBirthApps = (list) => { try { localStorage.setItem(bpAppsKey(), JSON.stringify(list)) } catch { /* private mode */ } }
  const bpAddDays = (date, n) => { const day = new Date(date); while (n > 0) { day.setDate(day.getDate() + 1); if (day.getDay() % 6) n-- } return day }
  const bpGo = (hash) => { if (location.hash === hash) routeBirth(); else location.hash = hash }

  // where the search has got to; kept for the browser session so a refresh or Back lands in the same place
  const BP_STATE_KEY = 'meeseva-birth-flow'
  const bpState = (() => { try { return JSON.parse(sessionStorage.getItem(BP_STATE_KEY)) || {} } catch { return {} } })()
  const bpSave = () => { try { sessionStorage.setItem(BP_STATE_KEY, JSON.stringify(bpState)) } catch { /* private mode */ } }
  // form state lives in memory: the search form, and the application form being filled in
  const bpSearch = { district: '', pending: '', values: {}, errors: {}, formError: '', ack: '', ackError: '', districtError: '' }
  let bpForm = null

  /* ---- markup helpers */
  const bpOptions = (list, value, ph, label = (x) => x) => `<option value="">${esc(ph ?? t('bp.f.select'))}</option>` +
    list.map((x) => `<option value="${esc(x)}"${x === value ? ' selected' : ''}>${esc(label(x))}</option>`).join('')
  function bpField(ctx, name, label, control, { required = false, wide = false, hint = '' } = {}) {
    const err = ctx.errors[name]
    return `<label class="svc-field${wide ? ' svc-field--wide' : ''}"><span>${esc(label)}${required ? ' <b aria-hidden="true">*</b>' : ''}</span>${control}${
      hint ? `<small id="bp-hint-${name}">${hint}</small>` : ''}${err ? `<em class="svc-err" id="bp-err-${name}">${esc(err)}</em>` : ''}</label>`
  }
  const bpAttrs = (ctx, name, required) => `name="${name}" id="bp-${name}"${required ? ' aria-required="true"' : ''}${
    ctx.errors[name] ? ` aria-invalid="true" aria-describedby="bp-err-${name}"` : ''}`
  const bpInput = (ctx, name, { type = 'text', required = false, ph = '', extra = '' } = {}) =>
    `<input type="${type}" ${bpAttrs(ctx, name, required)} value="${esc(ctx.values[name] ?? '')}"${ph ? ` placeholder="${esc(ph)}"` : ''} ${extra} />`
  const bpSelect = (ctx, name, list, { required = false, ph, label, disabled = false } = {}) =>
    `<select ${bpAttrs(ctx, name, required)}${disabled ? ' disabled' : ''}>${bpOptions(list, ctx.values[name], ph, label)}</select>`
  const bpText = (ctx, name, max, required = true) =>
    `<textarea ${bpAttrs(ctx, name, required)} maxlength="${max}" data-max="${max}">${esc(ctx.values[name] ?? '')}</textarea><small class="bp-count" data-for="${name}">${esc(t('bp.a.charsLeft', { n: max - String(ctx.values[name] ?? '').length }))}</small>`
  const bpFile = (ctx, name) => {
    const file = ctx.values[name]
    return `<input type="file" ${bpAttrs(ctx, name, true)} accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" />${
      file ? `<small>${esc(t('bp.a.selected', { f: `${file.name} (${Math.max(1, Math.round(file.size / 1024))} KB)` }))}</small>` : ''}`
  }
  const bpDl = (rows) => `<dl class="svc-dl">${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${v}</dd></div>`).join('')}</dl>`
  const bpRecordRows = (r) => [
    [t('bp.r.ack'), esc(r.ack)], [t('bp.r.reg'), `${esc(r.regNo)} / ${esc(r.regYear)}`], [t('bp.r.regDate'), bpDate(r.regDate)],
    [t('bp.r.child'), r.child ? esc(bpChild(r)) : `<em>${esc(t('bp.unnamed'))}</em>`], [t('bp.r.dob'), bpDate(r.dob)], [t('bp.r.gender'), bpGender(r.gender)],
    [t('bp.r.mother'), esc(r.mother)], [t('bp.r.father'), esc(r.father)], [t('bp.r.hospital'), esc(r.hospital)],
    [t('bp.r.unit'), esc(bpUnit(r))], [t('bp.r.district'), esc(r.district)], [t('bp.r.address'), esc(r.address)], [t('bp.r.officer'), esc(r.officer)],
  ]
  const bpCrumbs = (items) => `<nav class="svc-crumbs" aria-label="Breadcrumb"><ol>${items.map(([label, href]) =>
    `<li>${href ? `<a href="${href}">${esc(label)}</a>` : `<span aria-current="page">${esc(label)}</span>`}</li>`).join('')}</ol></nav>`
  const bpCrumbBase = () => [[t('bp.home'), '#top'], [t('bp.lifeServices'), '#life-stages']]
  const bpCatCrumb = () => `A. ${catName(bpCat())}`
  function bpSteps(labels, current, links = []) {
    return `<ol class="svc-steps">${labels.map((label, i) => {
      const done = i < current
      const inner = `<i>${done ? bpSvg('check', 15, 'stroke-width="3"') : i + 1}</i><span>${esc(label)}</span>`
      return `<li class="${i === current ? 'is-current' : done ? 'is-done' : ''}"${i === current ? ' aria-current="step"' : ''}>${
        done && links[i] ? `<a href="${links[i]}">${inner}</a>` : `<span>${inner}</span>`}</li>`
    }).join('')}</ol>`
  }
  function bpBanner({ eyebrow, title, desc, chips = '' }) {
    const st = STAGE.A
    return `<section class="svc-banner" aria-labelledby="bp-title">
        <img src="${st.img(st.widths ? st.widths[1] : 1280)}" alt="" style="object-position:${st.pos}" />
        <div class="svc-banner-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${bpCat().icon}</svg></div>
        <div><p class="svc-eyebrow">${esc(eyebrow)}</p><h1 class="svc-title" id="bp-title" tabindex="-1">${esc(title)}</h1>
          <p class="svc-desc">${esc(desc)}</p>${chips ? `<div class="svc-chips">${chips}</div>` : ''}</div>
      </section>`
  }
  const bpSrH1 = (text) => `<h1 class="sr-only" id="bp-title" tabindex="-1">${esc(text)}</h1>`
  const bpSvcTitle = (key) => t(BP_SERVICES[key].title)
  const bpTime = (key) => (BP_SERVICES[key].days ? t('bp.days', { n: BP_SERVICES[key].days }) : t('bp.instant'))
  const bpDetailsHash = (district) => `${BP_BASE}/find-record/details${district ? `?district=${encodeURIComponent(district)}` : ''}`

  /* ---- step 1: find record */
  function bpFindView() {
    const cat = bpCat()
    const apps = loadBirthApps()
    return bpCrumbs([...bpCrumbBase(), [bpCatCrumb(), null]])
      + bpSteps([t('bp.step.find'), t('bp.step.service')], 0)
      + bpBanner({ eyebrow: `${t('bp.stepOf', { n: 1, total: 2 })} · ${catName(cat)}`, title: t('bp.find.title'), desc: t('bp.find.desc') })
      + `<div class="svc-choices">
          <a class="svc-choice" href="${bpDetailsHash('')}"><span class="svc-choice-icon">${bpSvg('users', 26)}</span><b>${esc(t('bp.mode.details'))}</b><span>${esc(t('bp.mode.detailsDesc'))}</span></a>
          <button type="button" class="svc-choice" data-act="nac"><span class="svc-choice-icon">${bpSvg('fileQ', 26)}</span><b>${esc(t('bp.mode.nac'))}</b><span>${esc(t('bp.mode.nacDesc'))}</span></button>
        </div>`
      + (apps.length ? `<section class="svc-apps" aria-labelledby="bp-apps-h"><h2 id="bp-apps-h">${esc(t('bp.apps.h'))} · ${apps.length}</h2><p>${esc(t('bp.apps.p'))}</p>${apps.map((a) => `
          <div class="svc-app">
            <div><b>${esc(bpSvcTitle(a.service))}</b><span>${esc(a.no)} · ${bpDate(a.submitted)}${a.child ? ` · ${esc(a.child)}` : ''}</span></div>
            <span class="chip ${a.status === 'issued' ? 'chip--done' : 'chip--live'}">${esc(t(`bp.st.${a.status}`))}</span>
            <span class="svc-app-actions">
              <a class="svc-link" href="${BP_BASE}/applications/${esc(a.no)}">${esc(t('bp.apps.view'))}</a>
              <button type="button" class="svc-link" data-act="withdraw" data-no="${esc(a.no)}">${esc(t(a.status === 'issued' ? 'bp.apps.remove' : 'bp.apps.withdraw'))}</button>
            </span>
          </div>`).join('')}</section>` : '')
  }

  /* ---- search by details: select district / enter details */
  function bpDetailsView(q) {
    const district = q.get('district') || ''
    if (district && !BP_DISTRICTS.includes(district)) return { redirect: bpDetailsHash('') }
    if (district !== bpSearch.district) Object.assign(bpSearch, { district, values: {}, errors: {}, formError: '', ack: '', ackError: '' })
    const head = bpCrumbs([...bpCrumbBase(), [bpCatCrumb(), BP_BASE], [t('bp.searchByDetails'), null]])
      + bpSteps([t('bp.step.district'), t('bp.step.details'), t('bp.step.results')], district ? 1 : 0, [bpDetailsHash('')])
      + bpSrH1(t('bp.searchByDetails'))
    if (!district) {
      const ctx = { values: { district: bpSearch.pending }, errors: bpSearch.districtError ? { district: bpSearch.districtError } : {} }
      return head + `<section class="svc-panel">
          <div class="svc-panel-head"><div><h2>${esc(t('bp.district.h'))}</h2><p>${esc(t('bp.district.p'))}</p></div></div>
          <form class="svc-panel-body" data-form="district" novalidate>
            <div class="svc-inline">
              ${bpField(ctx, 'district', t('bp.f.district'), bpSelect(ctx, 'district', BP_DISTRICTS, { required: true, ph: t('bp.f.districtPh') }), { required: true })}
              <button type="submit" class="svc-btn" style="min-width:180px">${esc(t('bp.next'))}</button>
            </div>
          </form>
        </section>`
    }
    const ghmc = district === 'HYDERABAD'
    const ctx = bpSearch
    const regYears = Array.from({ length: 40 }, (_, i) => String(new Date().getFullYear() - i))
    const fields = ghmc
      ? bpField(ctx, 'dob', t('bp.f.dob'), bpInput(ctx, 'dob', { type: 'date', required: true, extra: `max="${bpToday()}"` }), { required: true })
        + bpField(ctx, 'circle', t('bp.f.circle'), bpSelect(ctx, 'circle', BP_CIRCLES, { required: true, ph: t('bp.f.circlePh') }), { required: true })
        + bpField(ctx, 'gender', t('bp.f.gender'), bpSelect(ctx, 'gender', BP_GENDERS, { required: true, ph: t('bp.f.genderPh'), label: bpGender }), { required: true })
        + bpField(ctx, 'regNo', t('bp.f.regNo'), bpInput(ctx, 'regNo', { ph: t('bp.f.optional'), extra: 'aria-describedby="bp-hint-regNo"' }), { hint: esc(t('bp.f.regNoNote')) })
        + bpField(ctx, 'mother', t('bp.f.mother'), bpInput(ctx, 'mother', { ph: t('bp.f.optional') }))
        + bpField(ctx, 'father', t('bp.f.father'), bpInput(ctx, 'father', { ph: t('bp.f.optional') }))
      : bpField(ctx, 'locationType', t('bp.f.locationType'), bpSelect(ctx, 'locationType', BP_LOCATION_TYPES, { required: true, ph: t('bp.f.locationTypePh') }), { required: true })
        + bpField(ctx, 'office', t('bp.f.office'), bpSelect(ctx, 'office', bpOffices(district, ctx.values.locationType), {
          required: true, disabled: !ctx.values.locationType, ph: ctx.values.locationType ? t('bp.f.officePh') : t('bp.f.officeFirst') }), { required: true })
        + bpField(ctx, 'gender', t('bp.f.gender'), bpSelect(ctx, 'gender', BP_GENDERS, { required: true, ph: t('bp.f.genderPh'), label: bpGender }), { required: true })
        + bpField(ctx, 'regNo', t('bp.f.regNo'), bpInput(ctx, 'regNo', { ph: t('bp.f.optional') }))
        + bpField(ctx, 'regYear', t('bp.f.regYear'), bpSelect(ctx, 'regYear', regYears, { required: true, ph: t('bp.f.regYearPh') }), { required: true })
        + bpField(ctx, 'dob', t('bp.f.dob'), bpInput(ctx, 'dob', { type: 'date', extra: `max="${bpToday()}"` }))
        + bpField(ctx, 'mother', t('bp.f.mother'), bpInput(ctx, 'mother', { ph: t('bp.f.optional') }))
        + bpField(ctx, 'father', t('bp.f.father'), bpInput(ctx, 'father', { ph: t('bp.f.optional') }))
    const ackCtx = { values: { ack: bpSearch.ack }, errors: bpSearch.ackError ? { ack: bpSearch.ackError } : {} }
    return head
      + (ghmc ? `<details class="svc-panel"${bpSearch.ackError || bpSearch.ack ? ' open' : ''}>
          <summary class="svc-panel-head"><div><h2>${esc(t('bp.ack.h'))}</h2><p>${esc(t('bp.ack.p'))}</p></div>${bpSvg('chev', 22, 'class="svc-chev"')}</summary>
          <form class="svc-panel-body" data-form="ack" novalidate>
            <div class="svc-inline">
              ${bpField(ackCtx, 'ack', t('bp.ack.label'), bpInput(ackCtx, 'ack', { ph: t('bp.ack.ph'), extra: 'inputmode="numeric" maxlength="13" autocomplete="off"' }))}
              <button type="submit" class="svc-btn" style="min-width:160px">${bpSvg('search', 18)} ${esc(t('bp.ack.search'))}</button>
            </div>
          </form>
        </details>
        <p class="svc-or">${esc(t('bp.or'))}</p>` : '')
      + `<details class="svc-panel" open>
          <summary class="svc-panel-head"><h2>${esc(t('bp.details.h'))}</h2>${bpSvg('chev', 22, 'class="svc-chev"')}</summary>
          <form class="svc-panel-body" data-form="details" novalidate>
            <div class="svc-grid">${fields}</div>
            <p class="svc-note">${esc(t('bp.mandatory'))}</p>
            ${bpSearch.formError ? `<p class="svc-form-error" role="alert">${esc(bpSearch.formError)}</p>` : ''}
            <div class="svc-actions">
              <button type="button" class="svc-btn svc-btn--line" data-act="change-district">${esc(t('bp.changeDistrict'))}</button>
              <button type="button" class="svc-btn svc-btn--line" data-act="clear">${esc(t('bp.clear'))}</button>
              <button type="submit" class="svc-btn">${esc(t('bp.searchCta'))}</button>
            </div>
            <p class="svc-hint">${bpSvg('info', 16)}<span>${esc(t('bp.demo'))}</span></p>
          </form>
        </details>`
  }

  /* ---- search results */
  function bpResultsView() {
    const rows = (bpState.results || []).map(bpRecord).filter(Boolean)
    if (!rows.length) return { redirect: bpDetailsHash(bpState.district || '') }
    const ghmc = rows[0].district === 'HYDERABAD'
    const nameCell = (r) => (r.child ? `<span class="up svc-name">${esc(bpChild(r))}</span>`
      : `<button type="button" class="svc-unnamed" data-act="unnamed" data-ack="${esc(r.ack)}" title="${esc(t('bp.unnamedTip'))}">${esc(t('bp.unnamed'))}</button>`)
    const viewBtn = (r) => `<button type="button" class="svc-btn svc-btn--sm" data-act="view" data-ack="${esc(r.ack)}" aria-label="${esc(t('bp.view'))}: ${esc(bpChild(r) || t('bp.unnamed'))}, ${esc(r.ack)}">${bpSvg('eye', 16)} ${esc(t('bp.view'))}</button>`
    const head = ghmc
      ? ['bp.col.ack', 'bp.col.child', 'bp.col.parents', 'bp.col.hospital', 'bp.col.officer']
      : ['bp.col.child', 'bp.col.dob', 'bp.col.gender', 'bp.col.parents', 'bp.col.hospital', 'bp.col.location', 'bp.col.reg']
    const cells = (r) => ghmc
      ? [`<span class="mono">${esc(r.ack)}</span>`, nameCell(r), `<span class="up">${esc(r.mother)} / ${esc(r.father)}</span>`, `<span class="up">${esc(r.hospital)}</span>`, esc(r.officer)]
      : [nameCell(r), bpDateDash(r.dob), bpGender(r.gender), `<span class="up">${esc(r.mother)} / ${esc(r.father)}</span>`, `<span class="up">${esc(r.hospital)}</span>`, esc(r.office), `${esc(r.regNo)} / ${esc(r.regYear)}`]
    return bpCrumbs([...bpCrumbBase(), [bpCatCrumb(), BP_BASE], [t('bp.searchByDetails'), null]])
      + bpSteps([t('bp.step.district'), t('bp.step.details'), t('bp.step.results')], 2, [bpDetailsHash(''), bpDetailsHash(bpState.district)])
      + `<section class="svc-panel">
          <div class="svc-panel-head"><div><h1 class="svc-h1" id="bp-title" tabindex="-1" style="margin:0;font-size:20px;outline:none">${esc(t('bp.res.h'))}</h1><p>${esc(t('bp.res.p', { n: rows.length }))}</p></div>
            <a class="svc-link" href="${bpDetailsHash(bpState.district)}">${bpSvg('left', 16)} ${esc(t('bp.res.back'))}</a></div>
          <div class="svc-panel-body">
            <div class="svc-criteria">${(bpState.criteria || []).map(([k, v]) => `<p style="margin:0"><span>${esc(t(k))}:</span> <b>${esc(v)}</b></p>`).join('')}</div>
            <div class="svc-table-wrap"><table class="svc-table">
              <thead><tr>${head.map((k) => `<th scope="col">${esc(t(k))}</th>`).join('')}<th><span class="sr-only">${esc(t('bp.view'))}</span></th></tr></thead>
              <tbody>${rows.map((r) => `<tr>${cells(r).map((c, i) => `<td data-label="${esc(t(head[i]))}">${c}</td>`).join('')}<td>${viewBtn(r)}</td></tr>`).join('')}</tbody>
            </table></div>
          </div>
        </section>`
  }

  /* ---- step 2: select service */
  function bpSelectView() {
    if (!bpState.check) return { redirect: BP_BASE }
    const cat = bpCat()
    const r = bpState.check === 'found' ? bpRecord(bpState.record) : null
    if (bpState.check === 'found' && !r) return { redirect: BP_BASE }
    const cards = r ? [['cert', ''], ['name', r.child ? t('bp.s.nameDone') : ''], ['corr', '']] : [['nac', '']]
    const available = cards.filter(([, off]) => !off).length
    const chips = `<span class="svc-chip">${esc(t('bp.chip.services', { n: cat.items.length }))}</span>`
      + `<span class="svc-chip svc-chip--live">${esc(t('bp.chip.avail', { n: available }))}</span>`
      + `<span class="svc-chip svc-chip--soon">${esc(t('bp.chip.soon', { n: cat.items.filter((i) => !i[3]).length }))}</span>`
    const ref = bpState.reference
    return bpCrumbs([...bpCrumbBase(), [bpCatCrumb(), null]])
      + bpSteps([t('bp.step.find'), t('bp.step.service')], 1, [BP_BASE])
      + bpBanner({ eyebrow: `${t('bp.stepOf', { n: 2, total: 2 })} · ${catName(cat)}`, title: catName(cat), desc: catTag(cat), chips })
      + `<div class="svc-statusbar">
          <span class="svc-status">${r
            ? `${bpSvg('check', 18, 'stroke-width="2.5"')} ${esc(t('bp.found'))} <b>${esc(bpChild(r) || t('bp.unnamed'))}</b> · ${esc(t('bp.ackShort'))} ${esc(r.ack)}`
            : `${bpSvg('info', 18)} ${esc(t('bp.notFound'))}${ref ? ` · ${esc(ref.label)} ${esc(ref.value)}` : ''}`}</span>
          <a class="svc-link" href="${bpDetailsHash(bpState.district || '')}">${bpSvg('left', 16)} ${esc(t('bp.searchAgain'))}</a>
        </div>`
      + (r ? `<details class="svc-panel svc-record"><summary class="svc-panel-head"><h2>${esc(t('bp.rec.h'))}</h2>${bpSvg('chev', 22, 'class="svc-chev"')}</summary>
          <div class="svc-panel-body">${bpDl(bpRecordRows(r))}</div></details>` : '')
      + `<div class="svc-cards">${cards.map(([key, off], i) => {
          const inner = `<span class="svc-card-num">${i + 1}</span><b><span>${esc(bpSvcTitle(key))}</span>${off ? '' : bpSvg('upRight', 18)}</b>
            <span>${esc(off || t(BP_SERVICES[key].desc))}</span><small>₹${BP_SERVICES[key].fee}${key === 'cert' ? ' / copy' : ''} · ${esc(bpTime(key))}</small>`
          return off ? `<div class="svc-card" aria-disabled="true" data-service="${key}">${inner}</div>`
            : `<a class="svc-card" href="${BP_BASE}/apply/${key}" data-service="${key}">${inner}</a>`
        }).join('')}</div>
        <p class="svc-fees-note">${esc(t('bp.fees'))}</p>`
  }

  /* ---- application forms */
  function bpNewForm(svc, record) {
    const stamp = new Date().toISOString().slice(2, 4)
    const appNo = `${BP_SERVICES[svc].code}02${stamp}${String(Math.floor(Math.random() * 1e8)).padStart(8, '0')}`
    const values = { salutation: 'Sri', copies: svc === 'cert' || svc === 'nac' ? '1' : '', payMode: 'upi' }
    if (svc === 'name' && record) values.childSur = record.surname
    if (svc === 'nac') values.serviceType = 'Non-Availability Certificate (Birth)'
    return { svc, record: record?.ack ?? '', values, errors: {}, formError: '', payment: false, busy: false, appNo }
  }
  function bpApplicantSection(ctx) {
    const pair = (selName, list, inName, extra = '') => `<div class="svc-pair">${bpSelect(ctx, selName, list, { required: true })}${bpInput(ctx, inName, { required: true, extra })}</div>`
    return `<section class="svc-section"><h3>${esc(t('bp.sec.applicant'))}</h3><div class="svc-grid">
        ${bpField(ctx, 'appNo', t('bp.a.appNo'), `<input type="text" id="bp-appNo" value="${esc(bpForm.appNo)}" readonly />`, { required: true })}
        ${bpField(ctx, 'aadhaarNo', t('bp.a.aadhaar'), `<input type="text" id="bp-aadhaarNo" value="XXXX XXXX ${esc(bpAadhaar4() || '----')}" readonly />`)}
        ${bpField(ctx, 'applicant', t('bp.a.name'), pair('salutation', ['Sri', 'Smt', 'Kum', 'Dr'], 'applicant', `autocomplete="name" aria-label="${esc(t('bp.a.name'))}"`), { required: true })}
        ${bpField(ctx, 'relationName', t('bp.a.relation'), pair('relation', ['Father', 'Mother', 'Guardian', 'Self'], 'relationName', `placeholder="${esc(t('bp.a.relationName'))}" aria-label="${esc(t('bp.a.relationName'))}"`), { required: true })}
        ${bpField(ctx, 'mobile', t('bp.a.mobile'), bpInput(ctx, 'mobile', { type: 'tel', required: true, extra: 'inputmode="numeric" maxlength="10" autocomplete="tel"' }), { required: true })}
        ${bpField(ctx, 'email', t('bp.a.email'), bpInput(ctx, 'email', { type: 'email', extra: 'autocomplete="email"' }))}
        ${bpField(ctx, 'address', t('bp.a.address'), bpText(ctx, 'address', 200), { required: true, wide: false })}
        ${bpField(ctx, 'pincode', t('bp.a.pincode'), bpInput(ctx, 'pincode', { required: true, extra: 'inputmode="numeric" maxlength="6"' }), { required: true })}
      </div></section>`
  }
  function bpApplyView(svc) {
    if (!BP_SERVICES[svc]) return { redirect: BP_BASE }
    const record = svc === 'nac' ? null : bpRecord(bpState.record)
    if (svc !== 'nac' && (!record || bpState.check !== 'found')) return { redirect: BP_BASE }
    if (svc === 'name' && record.child) return { redirect: `${BP_BASE}/select` }
    if (!bpForm || bpForm.svc !== svc || bpForm.record !== (record?.ack ?? '')) bpForm = bpNewForm(svc, record)
    const ctx = bpForm, v = ctx.values
    const authority = !record || record.district === 'HYDERABAD' ? 'GHMC' : record.office
    const recordSection = record ? `<section class="svc-section"><h3>${esc(t('bp.sec.record'))}</h3><div class="svc-grid">${[
      ['bp.r.ack', record.ack], ['bp.r.child', bpChild(record) || t('bp.unnamed')], ['bp.r.dob', bpDate(record.dob)], ['bp.r.gender', bpGender(record.gender)],
      ['bp.r.mother', record.mother], ['bp.r.father', record.father], ['bp.r.reg', `${record.regNo} / ${record.regYear}`], ['bp.r.unit', bpUnit(record)]]
      .map(([k, val]) => `<label class="svc-field"><span>${esc(t(k))}</span><input type="text" value="${esc(val)}" readonly /></label>`).join('')}</div></section>` : ''
    let specific = ''
    if (svc === 'cert') {
      specific = `<section class="svc-section"><h3>${esc(t('bp.sec.certDetails'))}</h3><div class="svc-grid">
          ${bpField(ctx, 'purpose', t('bp.a.purpose'), bpInput(ctx, 'purpose', { required: true }), { required: true })}
          ${bpField(ctx, 'copies', t('bp.a.copies'), bpInput(ctx, 'copies', { type: 'number', required: true, extra: 'min="1" max="10" inputmode="numeric"' }), { required: true })}
        </div></section>`
    } else if (svc === 'name') {
      specific = `<section class="svc-section"><h3>${esc(t('bp.sec.name'))}</h3><div class="svc-grid">
          ${bpField(ctx, 'childFirst', t('bp.a.childFirst'), bpInput(ctx, 'childFirst', { required: true, extra: 'autocomplete="off"' }), { required: true })}
          ${bpField(ctx, 'childSur', t('bp.a.childSur'), bpInput(ctx, 'childSur', { required: true, extra: 'autocomplete="off"' }), { required: true })}
        </div></section>
        <section class="svc-section"><h3>${esc(t('bp.sec.doc'))}</h3><div class="svc-grid svc-grid--2">
          ${bpField(ctx, 'doc', t('bp.a.docName'), bpFile(ctx, 'doc'), { required: true, hint: esc(t('bp.a.docHint')) })}
        </div></section>`
    } else if (svc === 'corr') {
      const current = !v.field ? '' : v.field === 'dob' ? bpDate(record.dob) : v.field === 'gender' ? bpGender(record.gender)
        : v.field === 'child' ? (bpChild(record) || t('bp.unnamed')) : record[v.field]
      const correctedCtl = v.field === 'dob' ? bpInput(ctx, 'corrected', { type: 'date', required: true, extra: `max="${bpToday()}"` })
        : v.field === 'gender' ? bpSelect(ctx, 'corrected', BP_GENDERS, { required: true, label: bpGender }) : bpInput(ctx, 'corrected', { required: true })
      const fieldLabel = { child: 'bp.r.child', dob: 'bp.r.dob', gender: 'bp.r.gender', mother: 'bp.r.mother', father: 'bp.r.father', address: 'bp.r.address' }
      specific = `<section class="svc-section"><h3>${esc(t('bp.sec.corr'))}</h3><div class="svc-grid">
          ${bpField(ctx, 'field', t('bp.a.field'), bpSelect(ctx, 'field', BP_CORRECTABLE, { required: true, label: (k) => t(fieldLabel[k]) }), { required: true })}
          ${v.field ? bpField(ctx, 'current', t('bp.a.current'), `<input type="text" id="bp-current" value="${esc(current)}" readonly />`)
            + bpField(ctx, 'corrected', t('bp.a.corrected'), correctedCtl, { required: true }) : ''}
          ${bpField(ctx, 'reason', t('bp.a.reason'), bpText(ctx, 'reason', 250), { required: true, wide: true })}
        </div></section>
        <section class="svc-section"><h3>${esc(t('bp.sec.doc'))}</h3><div class="svc-grid svc-grid--2">
          ${bpField(ctx, 'doc', t('bp.a.docCorr'), bpFile(ctx, 'doc'), { required: true, hint: esc(t('bp.a.docHint')) })}
        </div></section>`
    } else {
      specific = `<section class="svc-section"><h3>${esc(t('bp.sec.nacDetails'))} <small>${esc(t('bp.sec.nacDetailsNote'))}</small></h3><div class="svc-grid">
          ${bpField(ctx, 'circle', t('bp.f.circle'), bpSelect(ctx, 'circle', BP_CIRCLES, { required: true }), { required: true })}
          ${bpField(ctx, 'ward', t('bp.a.ward'), bpSelect(ctx, 'ward', v.circle ? bpWards(v.circle) : [], { required: true, disabled: !v.circle }), { required: true })}
          ${bpField(ctx, 'locality', t('bp.a.locality'), bpSelect(ctx, 'locality', v.circle ? bpLocalities(v.circle) : [], { required: true, disabled: !v.ward }), { required: true })}
          ${bpField(ctx, 'gender', t('bp.f.gender'), bpSelect(ctx, 'gender', BP_GENDERS, { required: true, label: bpGender }), { required: true })}
          ${bpField(ctx, 'dob', t('bp.f.dob'), bpInput(ctx, 'dob', { type: 'date', required: true, extra: `max="${bpToday()}"` }), { required: true })}
          ${bpField(ctx, 'delivery', t('bp.a.delivery'), bpSelect(ctx, 'delivery', ['Home', 'Hospital', 'Others'], { required: true }), { required: true })}
          ${bpField(ctx, 'mother', t('bp.f.mother'), bpInput(ctx, 'mother', { required: true }), { required: true })}
          ${bpField(ctx, 'father', t('bp.f.father'), bpInput(ctx, 'father', { required: true }), { required: true })}
          <span></span>
          ${bpField(ctx, 'motherUid', t('bp.a.motherUid'), bpInput(ctx, 'motherUid', { extra: 'inputmode="numeric" maxlength="12"' }))}
          ${bpField(ctx, 'fatherUid', t('bp.a.fatherUid'), bpInput(ctx, 'fatherUid', { extra: 'inputmode="numeric" maxlength="12"' }))}
          <span></span>
          ${bpField(ctx, 'parentsAddress', t('bp.a.parentsAddress'), bpText(ctx, 'parentsAddress', 200), { required: true })}
          ${bpField(ctx, 'parentsPin', t('bp.a.pincode'), bpInput(ctx, 'parentsPin', { required: true, extra: 'inputmode="numeric" maxlength="6"' }), { required: true })}
          <span></span>
          ${bpField(ctx, 'residence', t('bp.a.residence'), bpText(ctx, 'residence', 200), { required: true })}
          ${bpField(ctx, 'residencePin', t('bp.a.pincode'), bpInput(ctx, 'residencePin', { required: true, extra: 'inputmode="numeric" maxlength="6"' }), { required: true })}
        </div></section>
        <section class="svc-section"><h3>${esc(t('bp.sec.lrbd'))} <small>${esc(t('bp.sec.lrbdNote'))}</small></h3><div class="svc-grid">
          ${bpField(ctx, 'lrbdDistrict', t('bp.f.district'), bpSelect(ctx, 'lrbdDistrict', BP_DISTRICTS, { required: true }), { required: true })}
          ${bpField(ctx, 'mandal', t('bp.a.mandal'), bpSelect(ctx, 'mandal', v.lrbdDistrict ? bpMandals(v.lrbdDistrict) : [], { required: true, disabled: !v.lrbdDistrict }), { required: true })}
          ${bpField(ctx, 'village', t('bp.a.village'), bpSelect(ctx, 'village', v.mandal ? bpVillages(v.mandal) : [], { required: true, disabled: !v.mandal }), { required: true })}
        </div></section>
        <section class="svc-section"><h3>${esc(t('bp.sec.ghmc'))}</h3><div class="svc-grid">
          ${bpField(ctx, 'purpose', t('bp.a.purpose'), bpInput(ctx, 'purpose', { required: true }), { required: true })}
          ${bpField(ctx, 'copies', t('bp.a.copies'), bpInput(ctx, 'copies', { type: 'number', required: true, extra: 'min="1" max="10" inputmode="numeric"' }), { required: true })}
          ${bpField(ctx, 'doc', t('bp.a.docNac'), bpFile(ctx, 'doc'), { required: true, hint: esc(t('bp.a.docHint')) })}
        </div></section>`
    }
    const serviceType = svc === 'nac' ? `<section class="svc-section"><div class="svc-grid">
        ${bpField(ctx, 'serviceType', t('bp.a.serviceType'), bpSelect(ctx, 'serviceType', ['Non-Availability Certificate (Birth)', 'Non-Availability Certificate (Birth) – for Late Registration'], { required: true }), { required: true })}
      </div></section>` : ''
    const sv = BP_SERVICES[svc]
    const copies = svc === 'cert' || svc === 'nac' ? Math.max(1, Number(v.copies) || 1) : 1
    const fee = sv.fee * copies, total = fee + BP_USER_CHARGES
    const pay = ctx.payment ? `<section class="svc-pay" aria-labelledby="bp-pay-h">
        <h3 id="bp-pay-h" tabindex="-1">${esc(t('bp.pay.h'))}</h3>
        <table><tbody>
          <tr><td>${esc(t('bp.pay.fee', { s: bpSvcTitle(svc) }))}${copies > 1 || svc === 'cert' || svc === 'nac' ? ` <small>(${esc(t('bp.pay.perCopy', { f: sv.fee, n: copies }))})</small>` : ''}</td><td>₹${fee}</td></tr>
          <tr><td>${esc(t('bp.pay.user'))}</td><td>₹${BP_USER_CHARGES}</td></tr>
          <tr class="total"><td>${esc(t('bp.pay.total'))}</td><td>₹${total}</td></tr>
        </tbody></table>
        <div class="svc-pay-modes" role="radiogroup" aria-label="${esc(t('bp.pay.mode'))}">${['upi', 'card', 'net'].map((m) =>
          `<label><input type="radio" name="payMode" value="${m}"${v.payMode === m ? ' checked' : ''} /> ${esc(t(`bp.pay.${m}`))}</label>`).join('')}</div>
        <div class="svc-actions">
          <button type="button" class="svc-btn" data-act="pay"${ctx.busy ? ' disabled' : ''}>${esc(ctx.busy ? t('bp.pay.busy') : t('bp.pay.cta', { n: total }))}</button>
          <button type="button" class="svc-btn svc-btn--line" data-act="edit"${ctx.busy ? ' disabled' : ''}>${esc(t('bp.pay.edit'))}</button>
        </div>
      </section>` : ''
    return bpCrumbs([...bpCrumbBase(), [bpCatCrumb(), BP_BASE], [bpSvcTitle(svc), null]])
      + bpSteps([t('bp.step.find'), t('bp.step.service'), t('bp.step.apply')], 2, [BP_BASE, `${BP_BASE}/select`])
      + `<form class="svc-form" data-form="apply" novalidate>
          <h1 class="svc-form-title" id="bp-title" tabindex="-1">${esc(authority)} – ${esc(bpSvcTitle(svc))}</h1>
          <div class="svc-instr"><b>${esc(t('bp.form.instr'))}</b> ${esc(t('bp.form.instr1'))} ${esc(t('bp.form.instr2'))} ${esc(bpTime(svc))}.</div>
          <fieldset${ctx.payment ? ' disabled' : ''}>
            ${serviceType}${bpApplicantSection(ctx)}${recordSection}${specific}
            <label class="svc-declare"><input type="checkbox" name="declare" id="bp-declare"${v.declare ? ' checked' : ''}${ctx.errors.declare ? ' aria-invalid="true" aria-describedby="bp-err-declare"' : ''} />
              <span>${esc(t('bp.a.declare'))}${ctx.errors.declare ? `<em class="svc-err" id="bp-err-declare">${esc(ctx.errors.declare)}</em>` : ''}</span></label>
            ${ctx.formError ? `<p class="svc-form-error" role="alert" style="margin:18px 28px 0">${esc(ctx.formError)}</p>` : ''}
            ${ctx.payment ? '' : `<div class="svc-form-foot">
              <a class="svc-btn svc-btn--line" href="${BP_BASE}/select">${esc(t('bp.a.back'))}</a>
              <button type="submit" class="svc-btn">${esc(t('bp.a.showPayment'))}</button>
            </div>`}
          </fieldset>
          ${pay}
        </form>`
  }

  /* ---- acknowledgement and certificate */
  function bpReceiptRows(a) {
    return [
      [t('bp.d.service'), esc(bpSvcTitle(a.service))], [t('bp.d.no'), `<b>${esc(a.no)}</b>`], [t('bp.d.applicant'), `${esc(a.applicant)} · Aadhaar XXXX XXXX ${esc(a.aadhaar4 || '----')}`],
      ...(a.child ? [[t('bp.d.child'), esc(a.child)]] : []), ...(a.ack ? [[t('bp.d.record'), `${esc(t('bp.ackShort'))} ${esc(a.ack)}`]] : []),
      [t('bp.d.paid'), `₹${a.total}`], [t('bp.d.mode'), esc(t(`bp.pay.${a.payMode}`))],
      [t('bp.d.on'), new Date(a.submitted).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })],
      ...(a.due ? [[t('bp.d.by'), bpDate(a.due)]] : []), [t('bp.d.status'), esc(t(`bp.st.${a.status}`))],
    ]
  }
  function bpNotFound() {
    return bpCrumbs([...bpCrumbBase(), [bpCatCrumb(), BP_BASE]]) + `<div class="svc-done"><div class="svc-done-head">
        <h1 id="bp-title" tabindex="-1">${esc(t('bp.notfound.h'))}</h1><p>${esc(t('bp.notfound.p'))}</p></div>
        <div class="svc-actions"><a class="svc-btn" href="${BP_BASE}">${esc(t('bp.done.back'))}</a></div></div>`
  }
  function bpDoneView(no) {
    const a = loadBirthApps().find((x) => x.no === no)
    if (!a) return bpNotFound()
    return bpCrumbs([...bpCrumbBase(), [bpCatCrumb(), BP_BASE], [a.no, null]])
      + bpSteps([t('bp.step.find'), t('bp.step.service'), t('bp.step.apply')], 3)
      + `<div class="svc-done">
          <div class="svc-done-head">
            <div class="svc-done-icon">${bpSvg('check', 34, 'stroke-width="2.5"')}</div>
            <h1 id="bp-title" tabindex="-1">${esc(t(a.status === 'issued' ? 'bp.done.hCert' : 'bp.done.h'))}</h1>
            <p>${esc(t('bp.done.p'))}</p>
            <span class="svc-appno" id="bp-appno">${esc(a.no)}</span>
          </div>
          <div class="svc-receipt">${bpDl(bpReceiptRows(a))}</div>
          <div class="svc-actions">
            ${a.service === 'cert' ? `<a class="svc-btn" href="${BP_BASE}/certificate/${esc(a.no)}">${esc(t('bp.done.cert'))}</a>` : ''}
            <button type="button" class="svc-btn ${a.service === 'cert' ? 'svc-btn--line' : ''}" data-act="print-ack" data-no="${esc(a.no)}">${esc(t('bp.done.print'))}</button>
            <a class="svc-btn svc-btn--line" href="${BP_BASE}">${esc(t('bp.done.back'))}</a>
          </div>
        </div>`
  }
  function bpCertHTML(a) {
    const r = a.rec || bpRecord(a.ack)
    return `<article class="svc-cert" aria-label="${esc(t('bp.s.cert'))}">
        <header><p>Government of Telangana · MeeSeva</p><h2>BIRTH CERTIFICATE</h2><p>${esc(bpUnit(r))}, ${esc(r.district)}</p></header>
        ${bpDl([['Name of the child', r.child ? esc(bpChild(r)) : '<em>Not named yet</em>'], ['Sex', bpGender(r.gender)], ['Date of birth', bpDate(r.dob)],
          ['Place of birth', esc(r.hospital)], ['Name of the mother', esc(r.mother)], ['Name of the father', esc(r.father)],
          ['Address at the time of birth', esc(r.address)], ['Registration no.', esc(r.regNo)], ['Date of registration', bpDate(r.regDate)],
          ['Certificate no.', esc(a.no)], ['Copies', esc(a.copies)], ['Date of issue', bpDate(a.submitted)]])}
        <footer>Generated by the MeeSeva One Portal prototype from sample data. This is not a legal document.</footer>
      </article>`
  }
  function bpCertView(no) {
    const a = loadBirthApps().find((x) => x.no === no && x.service === 'cert')
    if (!a) return bpNotFound()
    return bpCrumbs([...bpCrumbBase(), [bpCatCrumb(), BP_BASE], [a.no, `${BP_BASE}/applications/${a.no}`], [t('bp.s.cert'), null]])
      + bpSrH1(t('bp.s.cert')) + bpCertHTML(a)
      + `<div class="svc-actions" style="justify-content:center;margin-top:24px">
          <button type="button" class="svc-btn" data-act="print-cert" data-no="${esc(a.no)}">${esc(t('bp.cert.print'))}</button>
          <a class="svc-btn svc-btn--line" href="${BP_BASE}/applications/${esc(a.no)}">${esc(t('bp.a.back'))}</a>
        </div>`
  }

  /* ---- routing: #/services/A[/...] shows these pages in place of the home page */
  const bpPage = document.getElementById('service-page')
  const homeMain = document.getElementById('main-content')
  let bpShown = ''
  function bpParse() {
    const h = location.hash
    if (h !== BP_BASE && !h.startsWith(`${BP_BASE}/`) && !h.startsWith(`${BP_BASE}?`)) return null
    const url = new URL(h.slice(1), 'http://x')
    return { parts: url.pathname.split('/').filter(Boolean).slice(2), q: url.searchParams, key: h }
  }
  function bpViewFor({ parts, q }) {
    const [a, b, c] = parts
    if (!a) return bpFindView()
    if (a === 'find-record' && b === 'details' && !c) return bpDetailsView(q)
    if (a === 'find-record' && b === 'details' && c === 'results') return bpResultsView()
    if (a === 'select') return bpSelectView()
    if (a === 'apply' && b) return bpApplyView(b)
    if (a === 'applications' && b) return bpDoneView(b)
    if (a === 'certificate' && b) return bpCertView(b)
    return { redirect: BP_BASE }
  }
  function closeBirthPage() {
    if (bpPage.hidden) return
    bpPage.hidden = true
    bpPage.innerHTML = ''
    homeMain.hidden = false
    bpShown = ''
    const id = location.hash.slice(1)
    if (id && !id.startsWith('/')) requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView())
  }
  function routeBirth(depth = 0) {
    const route = bpParse()
    if (!route) return closeBirthPage()
    // the life stage needs a login, as in the app: ask for it, then carry on to this page
    if (!signedIn) {
      closeBirthPage()
      if (!loginEl.classList.contains('open')) openLogin('A')
      return
    }
    const view = bpViewFor(route)
    if (view?.redirect && depth < 3) { history.replaceState(null, '', view.redirect); return routeBirth(depth + 1) }
    if (document.body.classList.contains('drawer-open')) closeDrawer()
    const changed = route.key !== bpShown
    bpShown = route.key
    // a new step starts at the top straight away, before the page height changes under the viewport
    // (the page's smooth scrolling is for in-page links)
    if (changed) window.scrollTo({ top: 0, behavior: 'instant' })
    homeMain.hidden = true
    bpPage.hidden = false
    bpPage.innerHTML = `<div class="svc-wrap">${bpDemoBar(route)}${typeof view === 'string' ? view : ''}</div>`
    document.title = `${catName(bpCat())} | MeeSeva`
    if (changed) document.getElementById('bp-title')?.focus({ preventScroll: true })
  }
  // redraw the current page (validation messages, dependent fields), optionally focusing a control
  function bpRedraw(focusId) {
    routeBirth()
    if (focusId) document.getElementById(focusId)?.focus()
  }
  window.addEventListener('hashchange', () => routeBirth())

  /* ---- validation */
  const BP_NAME_RE = /^[\p{L} .'-]+$/u
  function bpRequire(ctx, names) { for (const n of names) if (!String(ctx.values[n] ?? '').trim()) ctx.errors[n] = t('bp.err.required') }
  function bpCheck(ctx, name, test, message) { if (!ctx.errors[name] && String(ctx.values[name] ?? '').trim() && !test(String(ctx.values[name]).trim())) ctx.errors[name] = message }
  function bpCheckDoc(ctx) {
    const file = ctx.values.doc
    if (!file) ctx.errors.doc = t('bp.err.required')
    else if (!/\.(pdf|jpe?g|png)$/i.test(file.name)) ctx.errors.doc = t('bp.err.doc')
    else if (file.size > 2 * 1024 * 1024) ctx.errors.doc = t('bp.err.docSize')
  }
  function bpFocusFirstError(ctx) {
    const first = Object.keys(ctx.errors)[0]
    if (first) document.getElementById(`bp-${first}`)?.focus()
  }

  function bpSubmitDistrict() {
    if (!bpSearch.pending) { bpSearch.districtError = t('bp.err.district'); return bpRedraw('bp-district') }
    bpSearch.districtError = ''
    bpGo(bpDetailsHash(bpSearch.pending))
  }
  function bpSubmitDetails() {
    const ctx = bpSearch, v = ctx.values, ghmc = ctx.district === 'HYDERABAD'
    ctx.errors = {}
    bpRequire(ctx, ghmc ? ['dob', 'circle', 'gender'] : ['locationType', 'office', 'gender', 'regYear'])
    ctx.formError = Object.keys(ctx.errors).length ? t(ghmc ? 'bp.err.ghmc' : 'bp.err.cdma') : ''
    if (v.dob && v.dob > bpToday()) { ctx.errors.dob = t('bp.err.future'); ctx.formError = ctx.formError || t('bp.err.fix') }
    if (Object.keys(ctx.errors).length) { routeBirth(); return bpFocusFirstError(ctx) }
    const has = (value, query) => !query?.trim() || value.toLowerCase().includes(query.trim().toLowerCase())
    const regNo = ghmc ? '' : (v.regNo || '').trim()
    const curated = BIRTH_RECORDS.filter((r) => r.district === ctx.district && r.gender === v.gender
      && (ghmc ? r.circle === v.circle && r.dob === v.dob
        : r.type === v.locationType && r.office === v.office && r.regYear === v.regYear
          && (!regNo || r.regNo.toLowerCase() === regNo.toLowerCase()) && (!v.dob || r.dob === v.dob)))
    // the rest of the register for this search; a registration number narrows it to that one record
    const generated = regNo && curated.length ? [] : bpGenerate(ghmc
      ? { district: ctx.district, circle: v.circle, dob: v.dob, gender: v.gender }
      : { district: ctx.district, type: v.locationType, office: v.office, regYear: v.regYear, gender: v.gender, dob: v.dob || '', regNo })
    const found = [...curated, ...generated.filter((g) => !curated.some((c) => c.ack === g.ack))]
      .filter((r) => has(r.mother, v.mother) && has(r.father, v.father))
      .sort((a, b) => a.regDate.localeCompare(b.regDate) || a.ack.localeCompare(b.ack))
    Object.assign(bpState, { district: ctx.district, record: null, generated: found.filter((r) => !BIRTH_RECORDS.includes(r)) })
    if (!found.length) {
      // as in the app: nothing on record means the non-availability certificate is the service on offer
      Object.assign(bpState, { results: [], check: 'not_found',
        reference: ghmc ? { label: t('bp.f.dob'), value: bpDate(v.dob) } : { label: t('bp.f.regYear'), value: v.regYear } })
      bpSave()
      return bpGo(`${BP_BASE}/select`)
    }
    Object.assign(bpState, { results: found.map((r) => r.ack), check: null,
      criteria: ghmc ? [['bp.res.circle', v.circle.split(' - ')[0]], ['bp.res.dob', bpDateDash(v.dob)], ['bp.res.gender', v.gender]]
        : [['bp.res.district', ctx.district], ['bp.res.locationType', v.locationType], ['bp.res.regYear', v.regYear], ['bp.res.gender', v.gender]] })
    bpSave()
    bpGo(`${BP_BASE}/find-record/details/results`)
  }
  function bpSubmitAck() {
    const ack = bpSearch.ack.replace(/\D/g, '')
    if (ack.length !== 13) { bpSearch.ackError = t('bp.err.ack'); return bpRedraw('bp-ack') }
    bpSearch.ackError = ''
    const r = bpRecord(ack)
    Object.assign(bpState, { district: bpSearch.district, record: null })
    if (!r) {
      Object.assign(bpState, { results: [], check: 'not_found', reference: { label: t('bp.ackShort'), value: ack } })
      bpSave()
      return bpGo(`${BP_BASE}/select`)
    }
    Object.assign(bpState, { results: [r.ack], check: null, criteria: [['bp.col.ack', r.ack]] })
    bpSave()
    bpGo(`${BP_BASE}/find-record/details/results`)
  }

  function bpValidateApplication() {
    const ctx = bpForm, v = ctx.values, svc = ctx.svc
    ctx.errors = {}
    bpRequire(ctx, ['applicant', 'salutation', 'relation', 'relationName', 'mobile', 'address', 'pincode'])
    bpCheck(ctx, 'applicant', (s) => BP_NAME_RE.test(s), t('bp.err.letters'))
    bpCheck(ctx, 'relationName', (s) => BP_NAME_RE.test(s), t('bp.err.letters'))
    bpCheck(ctx, 'mobile', (s) => /^[6-9]\d{9}$/.test(s), t('bp.err.mobile'))
    bpCheck(ctx, 'email', (s) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s), t('bp.err.email'))
    bpCheck(ctx, 'pincode', (s) => /^5\d{5}$/.test(s), t('bp.err.pincode'))
    if (svc === 'cert' || svc === 'nac') {
      bpRequire(ctx, ['purpose', 'copies'])
      bpCheck(ctx, 'copies', (s) => /^\d+$/.test(s) && +s >= 1 && +s <= 10, t('bp.err.copies'))
    }
    if (svc === 'name') {
      bpRequire(ctx, ['childFirst', 'childSur'])
      for (const n of ['childFirst', 'childSur']) bpCheck(ctx, n, (s) => BP_NAME_RE.test(s), t('bp.err.letters'))
      bpCheckDoc(ctx)
    }
    if (svc === 'corr') {
      bpRequire(ctx, ['field', ...(v.field ? ['corrected'] : []), 'reason'])
      const r = bpRecord(ctx.record)
      if (!ctx.errors.corrected && v.field) {
        const now = { child: bpChild(r) }[v.field] ?? r[v.field]
        if (String(v.corrected).trim().toLowerCase() === String(now).trim().toLowerCase()) ctx.errors.corrected = t('bp.err.same')
        else if (v.field === 'dob' && v.corrected > bpToday()) ctx.errors.corrected = t('bp.err.future')
        else if (['child', 'mother', 'father'].includes(v.field)) bpCheck(ctx, 'corrected', (s) => BP_NAME_RE.test(s), t('bp.err.letters'))
      }
      bpCheckDoc(ctx)
    }
    if (svc === 'nac') {
      bpRequire(ctx, ['serviceType', 'circle', 'ward', 'locality', 'gender', 'dob', 'delivery', 'mother', 'father', 'parentsAddress', 'parentsPin',
        'residence', 'residencePin', 'lrbdDistrict', 'mandal', 'village'])
      for (const n of ['mother', 'father']) bpCheck(ctx, n, (s) => BP_NAME_RE.test(s), t('bp.err.letters'))
      for (const n of ['motherUid', 'fatherUid']) bpCheck(ctx, n, (s) => /^\d{12}$/.test(s), t('bp.err.uid'))
      for (const n of ['parentsPin', 'residencePin']) bpCheck(ctx, n, (s) => /^5\d{5}$/.test(s), t('bp.err.pincode'))
      if (!ctx.errors.dob && v.dob > bpToday()) ctx.errors.dob = t('bp.err.future')
      bpCheckDoc(ctx)
    }
    if (!v.declare) ctx.errors.declare = t('bp.err.declare')
    ctx.formError = Object.keys(ctx.errors).length ? t('bp.err.fix') : ''
    return !ctx.formError
  }
  function bpShowPayment() {
    if (!bpValidateApplication()) { routeBirth(); return bpFocusFirstError(bpForm) }
    bpForm.payment = true
    routeBirth()
    const h = document.getElementById('bp-pay-h')
    h?.scrollIntoView({ block: 'center' })
    h?.focus({ preventScroll: true })
  }
  function bpPay() {
    if (bpForm.busy) return
    bpForm.busy = true
    routeBirth()
    setTimeout(() => {
      const f = bpForm, v = f.values, sv = BP_SERVICES[f.svc], r = bpRecord(f.record)
      const copies = f.svc === 'cert' || f.svc === 'nac' ? Number(v.copies) : 1
      const now = new Date()
      const app = {
        no: f.appNo, service: f.svc, ack: r?.ack ?? '', rec: r, // the record itself, so the certificate still opens after this session's search is gone aadhaar4: bpAadhaar4(), applicant: `${v.salutation} ${v.applicant.trim()}`,
        child: f.svc === 'name' ? `${v.childFirst.trim()} ${v.childSur.trim()}` : r ? bpChild(r) : '',
        copies, total: sv.fee * copies + BP_USER_CHARGES, payMode: v.payMode, submitted: now.toISOString(),
        due: sv.days ? bpAddDays(now, sv.days).toISOString() : '', status: f.svc === 'cert' ? 'issued' : 'submitted',
      }
      saveBirthApps([app, ...loadBirthApps().filter((x) => x.no !== app.no)])
      bpForm = null
      bpGo(`${BP_BASE}/applications/${app.no}`)
    }, 900)
  }
  function bpPrint(html) {
    const root = document.getElementById('print-root')
    root.innerHTML = html
    document.body.classList.add('printing')
    window.addEventListener('afterprint', () => { document.body.classList.remove('printing'); root.innerHTML = '' }, { once: true })
    window.print()
  }

  /* ---- sample data: one click fills the current form, for demos */
  let bpFilledKey = ''
  // forms that get the button: Select District, Enter Details, and an application form until payment is shown
  function bpHasForm({ parts }) {
    const [a, b, c] = parts
    return (a === 'find-record' && b === 'details' && !c) || (a === 'apply' && !!b && !bpForm?.payment)
  }
  function bpDemoBar(route) {
    if (!bpHasForm(route)) return ''
    const note = bpFilledKey === route.key ? `<span class="svc-demo-note" role="status">${esc(t('bp.demoFilled'))}</span>` : '<span class="svc-demo-note" role="status"></span>'
    return `<div class="svc-demo-bar">${note}<button type="button" class="svc-demo" data-act="demo-fill">${bpSvg('wand', 17)} ${esc(t('bp.demoFill'))}</button></div>`
  }
  const BP_SAMPLE_DOC = { name: 'sample-supporting-document.pdf', size: 148 * 1024, type: 'application/pdf' }
  function bpSampleApplicant(record) {
    // with a birth record, the father applies; otherwise a sample parent
    const father = record ? record.father : 'Ramesh Yadav'
    return {
      salutation: 'Sri', applicant: father, relation: 'Father', relationName: `${father.split(' ')[0]} Venkataiah`,
      mobile: '9876543210', email: 'citizen@example.com',
      address: record ? record.address.slice(0, 200) : '2-14, Main Road, Moosapet, Hyderabad', pincode: record?.district === 'HYDERABAD' || !record ? '500018' : '506001',
      declare: true,
    }
  }
  function bpFillSample() {
    const route = bpParse()
    if (!route || !bpHasForm(route)) return
    const [a] = route.parts
    if (a === 'find-record' && !route.q.get('district')) {
      Object.assign(bpSearch, { pending: 'HYDERABAD', districtError: '' })
    } else if (a === 'find-record') {
      const d = bpSearch.district
      const cdma = d === 'WARANGAL'
        ? { locationType: 'Municipal Corporation', office: 'Greater Warangal Municipal Corporation', gender: 'M', regYear: '2023' }
        : { locationType: 'Municipality', office: bpOffices(d, 'Municipality')[0], gender: 'M', regYear: '2024' }
      Object.assign(bpSearch, { values: d === 'HYDERABAD' ? { dob: '2024-03-12', circle: '24 - Kukatpally', gender: 'F' } : cdma, errors: {}, formError: '' })
    } else if (bpForm) {
      const r = bpRecord(bpForm.record)
      const v = { ...bpForm.values, ...bpSampleApplicant(r) }
      if (bpForm.svc === 'cert') Object.assign(v, { purpose: 'Passport application', copies: '1' })
      if (bpForm.svc === 'name') Object.assign(v, { childFirst: r.gender === 'M' ? 'Vihaan' : 'Ananya', childSur: r.surname, doc: BP_SAMPLE_DOC })
      // a corrected house number, e.g. "4-21" -> "4-21/A"
      const fixedAddress = r ? r.address.replace(/(\d+-\d+)/, '$1/A') : ''
      if (bpForm.svc === 'corr') Object.assign(v, { field: 'address', corrected: fixedAddress !== r.address ? fixedAddress : `${r.address}, Ward 2`, reason: 'The house number was recorded incorrectly at registration.', doc: BP_SAMPLE_DOC })
      if (bpForm.svc === 'nac') {
        const circle = '23 - Moosapet', mandal = bpMandals('HYDERABAD')[0]
        Object.assign(v, {
          serviceType: 'Non-Availability Certificate (Birth)', circle, ward: bpWards(circle)[0], locality: bpLocalities(circle)[0], gender: 'M', dob: '2019-06-01',
          delivery: 'Home', mother: 'Lakshmi Yadav', father: 'Ramesh Yadav', motherUid: '', fatherUid: '',
          parentsAddress: '2-14, Main Road, Moosapet, Hyderabad', parentsPin: '500018', residence: '2-14, Main Road, Moosapet, Hyderabad', residencePin: '500018',
          lrbdDistrict: 'HYDERABAD', mandal, village: bpVillages(mandal)[0], purpose: 'School admission', copies: '1', doc: BP_SAMPLE_DOC,
        })
      }
      Object.assign(bpForm, { values: v, errors: {}, formError: '' })
    }
    bpFilledKey = route.key
    bpRedraw()
    bpPage.querySelector('.svc-demo')?.focus()
  }

  /* ---- events */
  bpPage.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]')
    if (!btn) return
    const act = btn.dataset.act
    if (act === 'nac') {
      Object.assign(bpState, { check: 'not_found', record: null, results: [], reference: null })
      bpSave()
      bpGo(`${BP_BASE}/select`)
    } else if (act === 'change-district') {
      bpSearch.pending = bpSearch.district
      bpGo(bpDetailsHash(''))
    } else if (act === 'clear') {
      Object.assign(bpSearch, { values: {}, errors: {}, formError: '' })
      bpRedraw()
    } else if (act === 'view' || act === 'unnamed') {
      Object.assign(bpState, { check: 'found', record: btn.dataset.ack, reference: null })
      bpSave()
      bpGo(act === 'view' ? `${BP_BASE}/select` : `${BP_BASE}/apply/name`)
    } else if (act === 'demo-fill') bpFillSample()
    else if (act === 'pay') bpPay()
    else if (act === 'edit') { bpForm.payment = false; bpRedraw('bp-applicant') }
    else if (act === 'withdraw') {
      if (!confirm(t('bp.apps.confirm', { no: btn.dataset.no }))) return
      saveBirthApps(loadBirthApps().filter((a) => a.no !== btn.dataset.no))
      bpRedraw()
    } else if (act === 'print-ack') {
      const a = loadBirthApps().find((x) => x.no === btn.dataset.no)
      if (a) bpPrint(`<h2>MeeSeva · ${esc(t(a.status === 'issued' ? 'bp.done.hCert' : 'bp.done.h'))}</h2><div class="svc-receipt">${bpDl(bpReceiptRows(a))}</div>`)
    } else if (act === 'print-cert') {
      const a = loadBirthApps().find((x) => x.no === btn.dataset.no)
      if (a) bpPrint(bpCertHTML(a))
    }
  })
  bpPage.addEventListener('submit', (e) => {
    const form = e.target.closest('[data-form]')
    if (!form) return
    e.preventDefault()
    const kind = form.dataset.form
    if (kind === 'district') bpSubmitDistrict()
    else if (kind === 'details') bpSubmitDetails()
    else if (kind === 'ack') bpSubmitAck()
    else if (kind === 'apply') bpShowPayment()
  })
  // keep what's typed in state, so redraws (language switch, dependent fields, errors) don't lose it
  function onBirthInput(e) {
    const ctl = e.target
    const form = ctl.closest('[data-form]')
    if (!ctl.name || !form) return
    const kind = form.dataset.form
    if (kind === 'district') { bpSearch.pending = ctl.value; bpSearch.districtError = ''; return }
    if (kind === 'ack') { ctl.value = ctl.value.replace(/\D/g, '').slice(0, 13); bpSearch.ack = ctl.value; return }
    const ctx = kind === 'details' ? bpSearch : bpForm
    if (!ctx) return
    if (ctl.type === 'file') {
      const file = ctl.files?.[0]
      ctx.values[ctl.name] = file ? { name: file.name, size: file.size, type: file.type } : null
    } else ctx.values[ctl.name] = ctl.type === 'checkbox' ? ctl.checked : ctl.value
    if (['mobile', 'pincode', 'parentsPin', 'residencePin', 'motherUid', 'fatherUid'].includes(ctl.name)) {
      ctl.value = ctl.value.replace(/\D/g, '')
      ctx.values[ctl.name] = ctl.value
    }
    const counter = bpPage.querySelector(`.bp-count[data-for="${ctl.name}"]`)
    if (counter) counter.textContent = t('bp.a.charsLeft', { n: Number(ctl.dataset.max) - ctl.value.length })
    if (ctx.errors[ctl.name]) { delete ctx.errors[ctl.name]; ctl.removeAttribute('aria-invalid'); document.getElementById(`bp-err-${ctl.name}`)?.remove() }
    // choices that change which options the next field offers
    const resets = { locationType: ['office'], circle: ['ward', 'locality'], ward: ['locality'], lrbdDistrict: ['mandal', 'village'], mandal: ['village'], field: ['corrected'] }
    if (e.type === 'change' && (resets[ctl.name] || ctl.type === 'file')) {
      for (const n of resets[ctl.name] || []) ctx.values[n] = ''
      bpRedraw(ctl.id)
    }
  }
  bpPage.addEventListener('input', onBirthInput)
  bpPage.addEventListener('change', onBirthInput)
  // the skip link jumps to whichever main area is showing
  document.querySelector('a.skip')?.addEventListener('click', (e) => {
    if (bpPage.hidden) return
    e.preventDefault()
    document.getElementById('bp-title')?.focus()
  })


  /* ---------------------------------------------------- login (Aadhaar + OTP) */
  // Opening a life stage needs a login. This build runs the prototype login: any
  // 12-digit number and any 6-digit code sign in, and nothing is sent anywhere.
  const loginEl = document.getElementById('login')
  const loginForm = document.getElementById('login-form')
  const aadhaarIn = document.getElementById('login-aadhaar')
  const otpIn = document.getElementById('login-otp')
  const otpStep = document.getElementById('login-otp-step')
  const loginErr = document.getElementById('login-error')
  const loginSubmit = document.getElementById('login-submit')
  const SESSION_KEY = 'meeseva-demo-session'
  let signedIn = (() => { try { return sessionStorage.getItem(SESSION_KEY) === '1' } catch { return false } })()
  const login = { otpSent: false, busy: '', error: '', pendingStage: null, returnFocus: null }
  const digits = (v) => v.replace(/\D/g, '')
  const formatAadhaar = (v) => digits(v).slice(0, 12).replace(/(\d{4})(?=\d)/g, '$1 ')

  function renderLogin() {
    const d = digits(aadhaarIn.value)
    otpStep.hidden = !login.otpSent
    aadhaarIn.disabled = login.otpSent || Boolean(login.busy)
    otpIn.disabled = login.busy === 'verify'
    document.getElementById('login-sent-text').textContent = t('login.otp.sent', { n: d.slice(-4) })
    loginErr.textContent = login.error
    aadhaarIn.setAttribute('aria-invalid', String(Boolean(login.error) && d.length !== 12))
    otpIn.setAttribute('aria-invalid', String(Boolean(login.error) && login.otpSent && digits(otpIn.value).length !== 6))
    loginSubmit.disabled = Boolean(login.busy)
    loginSubmit.textContent = login.busy === 'send' ? t('login.aadhaar.sending')
      : login.busy === 'verify' ? t('login.otp.verifying')
      : login.otpSent ? t('consent.login.btn') : t('login.aadhaar.send')
  }
  function renderAuth() {
    document.getElementById('login-btn-text').textContent = signedIn ? t('profile.logout') : t('cta.loginOnly')
  }
  function openLogin(stageId = null) {
    login.pendingStage = stageId
    login.otpSent = false; login.busy = ''; login.error = ''
    aadhaarIn.value = ''; otpIn.value = ''
    login.returnFocus = document.activeElement
    renderLogin()
    loginEl.classList.add('open')
    loginEl.setAttribute('aria-hidden', 'false')
    document.body.classList.add('login-open')
    setTimeout(() => aadhaarIn.focus(), 60)
  }
  function closeLogin() {
    if (!loginEl.classList.contains('open')) return
    loginEl.classList.remove('open')
    loginEl.setAttribute('aria-hidden', 'true')
    document.body.classList.remove('login-open')
    login.pendingStage = null
    login.returnFocus?.focus?.()
    if (!signedIn && location.hash.startsWith('#/')) history.replaceState(null, '', location.pathname + location.search)
  }
  function finishLogin() {
    signedIn = true
    try { sessionStorage.setItem(SESSION_KEY, '1') } catch { /* private mode */ }
    try { sessionStorage.setItem('meeseva-demo-aadhaar4', digits(aadhaarIn.value).slice(-4)) } catch { /* private mode */ }
    renderAuth()
    const stage = login.pendingStage
    closeLogin()
    if (stage) openStage(stage) // carry on to whatever was clicked
  }
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault()
    if (login.busy) return
    if (!login.otpSent) {
      if (digits(aadhaarIn.value).length !== 12) { login.error = t('login.aadhaar.err'); renderLogin(); aadhaarIn.focus(); return }
      login.error = ''; login.busy = 'send'; renderLogin()
      setTimeout(() => { login.busy = ''; login.otpSent = true; renderLogin(); otpIn.focus() }, 700)
    } else {
      if (digits(otpIn.value).length !== 6) { login.error = t('login.otp.err'); renderLogin(); otpIn.focus(); return }
      login.error = ''; login.busy = 'verify'; renderLogin()
      setTimeout(() => { login.busy = ''; finishLogin() }, 700)
    }
  })
  aadhaarIn.addEventListener('input', () => { aadhaarIn.value = formatAadhaar(aadhaarIn.value); if (login.error) { login.error = ''; renderLogin() } })
  otpIn.addEventListener('input', () => { otpIn.value = digits(otpIn.value).slice(0, 6); if (login.error) { login.error = ''; renderLogin() } })
  document.getElementById('login-change').addEventListener('click', () => {
    login.otpSent = false; login.error = ''; otpIn.value = ''; renderLogin(); aadhaarIn.focus()
  })
  document.getElementById('login-resend').addEventListener('click', () => {
    login.error = ''; otpIn.value = ''; login.busy = 'send'; renderLogin()
    setTimeout(() => { login.busy = ''; renderLogin(); otpIn.focus() }, 700)
  })
  document.getElementById('login-close').addEventListener('click', closeLogin)
  loginEl.addEventListener('click', (e) => { if (e.target === loginEl) closeLogin() })
  document.addEventListener('keydown', (e) => {
    if (!loginEl.classList.contains('open')) return
    if (e.key === 'Escape') { e.stopImmediatePropagation(); closeLogin() }
    if (e.key === 'Tab') {
      // keep focus inside the login card
      const f = [...loginEl.querySelectorAll('button, input')].filter((x) => !x.disabled && x.offsetParent !== null)
      const first = f[0], last = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
  }, true)
  document.getElementById('login-btn').addEventListener('click', () => {
    if (!signedIn) { openLogin(); return }
    signedIn = false
    try { sessionStorage.removeItem(SESSION_KEY) } catch { /* private mode */ }
    try { sessionStorage.removeItem('meeseva-demo-aadhaar4') } catch { /* private mode */ }
    if (location.hash.startsWith('#/')) location.hash = '#top' // service pages need a login
    renderAuth()
  })

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-open-stage]')
    if (!el) return
    if (signedIn) openStage(el.dataset.openStage)
    else openLogin(el.dataset.openStage)
  })
  document.getElementById('drawer-close').addEventListener('click', closeDrawer)
  document.getElementById('scrim').addEventListener('click', closeDrawer)
  document.addEventListener('keydown', (e) => {
    if (!document.body.classList.contains('drawer-open')) return
    if (e.key === 'Escape') closeDrawer()
    if (e.key === 'Tab') {
      // keep focus inside the open drawer
      const f = drawer.querySelectorAll('button, a[href], input, [tabindex]:not([tabindex="-1"])')
      const first = f[0], last = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
  })

  /* ---------------------------------------------------- search */
  const input = document.getElementById('search-input')
  // suggestions stay in English: the catalogue is searched in English, as in the app
  const suggestions = Object.values(STAGE).map((s) => s.q)
  let sIdx = 3
  const showHint = () => { input.placeholder = t('hero.try', { q: suggestions[sIdx] }) }
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setInterval(() => { sIdx = (sIdx + 1) % suggestions.length; showHint() }, 2400)
  }
  document.getElementById('search-form').addEventListener('submit', (e) => {
    e.preventDefault()
    // an empty box searches the current suggestion
    const q = input.value.trim() || suggestions[sIdx]
    if (!input.value.trim()) input.value = q
    openSearch(q)
  })

  /* ---------------------------------------------------- apply language */
  const LANGS = { en: { short: 'En', english: 'English' }, te: { short: 'Te', english: 'Telugu' } }
  function applyLang() {
    document.documentElement.lang = lang
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n) })
    // hero copy: one span per word for the blur reveal (after the first reveal they render sharp)
    document.querySelectorAll('.blur-copy').forEach((el) => {
      el.innerHTML = el.textContent.split(' ').map((w, i) => `<span class="bw" style="--i:${i}">${esc(w)}</span>`).join(' ')
    })
    document.querySelectorAll('[data-i18n-label]').forEach((el) => {
      el.setAttribute('aria-label', t(el.dataset.i18nLabel))
      if (el.title) el.title = t(el.dataset.i18nLabel)
    })
    document.querySelectorAll('[data-i18n-ph]').forEach((el) => { el.placeholder = t(el.dataset.i18nPh) })
    document.getElementById('lang-short').textContent = LANGS[lang].short
    document.getElementById('lang-btn').setAttribute('aria-label', `${t('a11y.language')}: ${LANGS[lang].english}`)
    document.querySelectorAll('[data-lang]').forEach((b) => b.setAttribute('aria-current', String(b.dataset.lang === lang)))
    showHint()
    renderStats()
    renderStages()
    if (drawerView) drawerView()
    if (location.hash.startsWith('#/')) routeBirth()
    renderLogin()
    renderAuth()
  }

  const langBtn = document.getElementById('lang-btn')
  const langMenu = document.getElementById('lang-menu')
  function setMenu(open) {
    langMenu.hidden = !open
    langBtn.setAttribute('aria-expanded', String(open))
    if (open) langMenu.querySelector('[aria-current="true"]')?.focus()
  }
  langBtn.addEventListener('click', () => setMenu(langMenu.hidden))
  langMenu.addEventListener('click', (e) => {
    const b = e.target.closest('[data-lang]')
    if (!b) return
    lang = b.dataset.lang
    store('meeseva-lang', lang)
    applyLang()
    setMenu(false)
    langBtn.focus()
  })
  document.addEventListener('pointerdown', (e) => { if (!langMenu.hidden && !e.target.closest('#lang')) setMenu(false) })
  document.getElementById('lang').addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !langMenu.hidden) { setMenu(false); langBtn.focus() }
  })
  document.getElementById('lang').addEventListener('focusout', (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setMenu(false)
  })

  /* ---------------------------------------------------- text size */
  let textSize = read('meeseva-text-size', ['default', 'large'], 'default')
  function applyTextSize() {
    document.documentElement.dataset.textSize = textSize
    document.querySelectorAll('[data-size]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.size === textSize)))
  }
  document.querySelectorAll('[data-size]').forEach((b) => b.addEventListener('click', () => {
    textSize = b.dataset.size
    store('meeseva-text-size', textSize)
    applyTextSize()
  }))

  applyTextSize()
  applyLang()

  // play the hero copy's blur-to-focus reveal once the fonts are in, so words don't reflow mid-animation
  const revealHero = () => requestAnimationFrame(() => document.querySelector('.hero').classList.add('blur-in'))
  ;(document.fonts?.ready ?? Promise.resolve()).then(revealHero)
  setTimeout(revealHero, 1500) // fallback if fonts are slow

  /* ---------------------------------------------------- reveal on scroll */
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target) }
  }, { threshold: 0.15 })
  document.querySelectorAll('.reveal').forEach((el, i) => {
    el.style.transitionDelay = `${(i % 4) * 70}ms`
    io.observe(el)
  })
  /* ---------------------------------------------------- Happening mascot follows the pointer */
  const hap = document.getElementById('hap')
  const hapFace = document.getElementById('hap-face')
  let hapFrame = 0
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    addEventListener('mousemove', (e) => {
      cancelAnimationFrame(hapFrame)
      hapFrame = requestAnimationFrame(() => {
        const b = hap.getBoundingClientRect()
        const dx = e.clientX - (b.left + b.width / 2)
        const dy = e.clientY - (b.top + b.height / 2)
        const dist = Math.hypot(dx, dy) || 1
        const reach = 46 * Math.min(dist / 260, 1) // gentle when near, full when far
        hapFace.style.transform = `translate(${(dx / dist) * reach}px, ${(dy / dist) * reach}px)`
      })
    })
  }
})()
