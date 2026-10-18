from playwright.sync_api import sync_playwright
import json, os
BASE_URL=os.environ.get("GAME_URL", "http://127.0.0.1:3000")
ARTIFACTS=os.environ.get("GAME_ARTIFACTS", "/tmp/r1-checks")
os.makedirs(ARTIFACTS, exist_ok=True)
errors=[]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1440,'height':1100},device_scale_factor=1)
 page.on('pageerror',lambda error:errors.append(str(error)))
 response=page.goto(BASE_URL,wait_until='networkidle')
 assert response.status==200
 page.evaluate("""async () => { const {createLife}=await import('/src/engine.js'); localStorage.setItem('another-life-v1',JSON.stringify(createLife('all',9))); }""")
 page.reload(wait_until='networkidle')
 page.locator('#step').click()
 page.locator('#step').click()
 page.locator('#step').click()
 assert page.locator('#age').inner_text()=='3'
 assert page.locator('[data-choice]').count()==3
 assert page.locator('#step').is_disabled()
 page.screenshot(path=ARTIFACTS+'/desktop.png',full_page=True)
 page.locator('[data-choice="0"]').click()
 assert page.locator('[data-choice]').count()==0
 page.locator('[data-focus="study"]').click()
 assert page.locator('[data-focus="study"]').get_attribute('aria-pressed')=='true'
 name=page.locator('#person-name').inner_text()
 page.reload(wait_until='networkidle')
 assert page.locator('#person-name').inner_text()==name
 assert page.locator('#age').inner_text()=='3'
 page.locator('#settings').click()
 page.locator('#new-mode').select_option('medieval')
 page.locator('#start-new').click()
 page.locator('#confirm-new').click()
 assert page.locator('#age').inner_text()=='0'
 assert '중세' in page.locator('#period-tag').inner_text()
 assert page.locator('#archive-count').inner_text()=='1'
 page.locator('#play').click()
 page.locator('[data-nav="archive"]').click()
 assert page.locator('.archive-entry').count()==1
 page.locator('[data-archive="0"]').click()
 assert name in page.locator('#modal-content').inner_text()
 page.locator('#close-modal').click()
 page.locator('[data-nav="guide"]').click()
 assert '유재민' in page.locator('#modal-content').inner_text()
 page.locator('#close-modal').click()
 page.set_viewport_size({'width':390,'height':844})
 page.screenshot(path=ARTIFACTS+'/mobile.png',full_page=True)
 assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
 page.locator('#step').click()
 assert page.locator('#age').inner_text()=='1'
 with page.expect_download() as info:
  page.locator('#export').click()
 assert info.value.suggested_filename.endswith('.txt')
 # A deterministic fresh life isolates automatic timing from random infant mortality.
 page.evaluate("""async () => { const {createLife}=await import('/src/engine.js'); localStorage.setItem('another-life-v1',JSON.stringify(createLife('all',9))); }""")
 page.reload(wait_until='networkidle')
 page.locator('#speed').select_option('1500')
 page.locator('#play').click()
 page.wait_for_function("document.getElementById('age').textContent === '1'", timeout=4000)
 page.locator('#settings').click()
 frozen_age=page.locator('#age').inner_text()
 page.wait_for_timeout(1900)
 assert page.locator('#age').inner_text()==frozen_age
 page.locator('#close-modal').click()
 page.wait_for_function("document.getElementById('age').textContent === '3'", timeout=6000)
 page.wait_for_timeout(1900)
 assert page.locator('#age').inner_text()=='3'
 assert page.locator('[data-choice]').count()==3
 assert errors==[],errors
 print(json.dumps({'desktop':'passed','mobile':'passed','save_restore':'passed','choice_pause':'passed','automatic_time':'passed','modal_freeze':'passed','focus':'passed','new_life':'passed','archive':'passed','export':'passed','page_errors':errors},ensure_ascii=False))
 browser.close()
