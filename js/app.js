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
  }
  function finishLogin() {
    signedIn = true
    try { sessionStorage.setItem(SESSION_KEY, '1') } catch { /* private mode */ }
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
