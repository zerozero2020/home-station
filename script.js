// ═══════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════
const svg = document.getElementById('canvas-svg');
const cableLayer = document.getElementById('cable-layer');
const deviceLayer = document.getElementById('device-layer');
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

let mode = 'draw'; // 'draw' | 'select'
let devices = [];
let cables = [];
let selectedCable = null;
let selectedDevice = null;
let editingDeviceId = null;
let pickedColor = '#6366F1';
let deviceIdCounter = 100;
let cableIdCounter = 200;

// Draw cable state
let drawState = null; // { fromDevice, fromPort, fromX, fromY }
let pendingCable = null; // { fromDevice, fromPort, fromX, fromY, toDevice, toPort, toX, toY }

// Drag state
let dragState = null;

// ═══════════════════════════════════════════
// CABLE COLORS
// ═══════════════════════════════════════════
const CABLE_COLORS = { dp:'#D97706', tb:'#7C3AED', usb:'#059669', xlr:'#DC2626' };
const CABLE_LABELS = { dp:'DisplayPort 1.4', tb:'Thunderbolt 4', usb:'USB 3.0', xlr:'XLR Audio' };
const CABLE_MARKERS = { dp:'url(#m-dp)', tb:'url(#m-tb)', usb:'url(#m-usb)', xlr:'url(#m-xlr)' };

// ═══════════════════════════════════════════
// INITIAL DEVICES
// ═══════════════════════════════════════════
const initialDevices = [
  {
    id:1, name:'Zero PC', sub:'Gaming rig · Ryzen 7 5800X · RTX 3060', color:'#6366F1',
    x:20, y:40, w:270, type:'source',
    ports:[
      {id:'p1a',dir:'out',label:'DP Out 1',ctype:'dp'},
      {id:'p1b',dir:'out',label:'DP Out 2',ctype:'dp'},
      {id:'p1c',dir:'out',label:'DP Out 3',ctype:'tb',note:'direct'}
    ]
  },
  {
    id:2, name:'Project Flow', sub:'MacBook Pro · M5 Pro · Thunderbolt 4', color:'#22C55E',
    x:20, y:240, w:270, type:'source',
    ports:[
      {id:'p2a',dir:'out',label:'Thunderbolt 4',ctype:'tb'}
    ]
  },
  {
    id:3, name:'Yeti Studio', sub:'XLR condenser mic · Logitech', color:'#DC2626',
    x:20, y:360, w:220, type:'peripheral',
    ports:[
      {id:'p3a',dir:'out',label:'XLR Out',ctype:'xlr'}
    ]
  },
  {
    id:4, name:'HyperX Mixer', sub:'Audio interface · phantom power', color:'#DC2626',
    x:20, y:480, w:270, type:'peripheral',
    ports:[
      {id:'p4a',dir:'in', label:'XLR In', ctype:'xlr'},
      {id:'p4b',dir:'out',label:'USB Out',ctype:'usb'}
    ]
  },
  {
    id:5, name:'Rainy 75', sub:'Keyboard', color:'#64748B',
    x:20, y:600, w:220, type:'peripheral',
    ports:[{id:'p5a',dir:'out',label:'USB Out',ctype:'usb'}]
  },
  {
    id:6, name:'ATK Blazing Sky ZERO', sub:'Wireless gaming mouse', color:'#64748B',
    x:20, y:700, w:220, type:'peripheral',
    ports:[{id:'p6a',dir:'out',label:'USB dongle',ctype:'usb'}]
  },
  {
    id:7, name:'TESmart DKS202-M24', sub:'KVM switch · DisplayPort 1.4 · 2 monitors · 2 PCs', color:'#F59E0B',
    x:350, y:40, w:360, type:'hub',
    ports:[
      {id:'p7a',dir:'in', label:'DP In 1',    ctype:'dp'},
      {id:'p7b',dir:'in', label:'DP In 2',    ctype:'dp'},
      {id:'p7c',dir:'in', label:'TB In',      ctype:'tb'},
      {id:'p7d',dir:'out',label:'DP Out 1',   ctype:'dp'},
      {id:'p7e',dir:'out',label:'DP Out 2',   ctype:'dp'},
      {id:'p7f',dir:'in', label:'USB 1 — Mixer',    ctype:'usb'},
      {id:'p7g',dir:'in', label:'USB 2 — Keyboard', ctype:'usb'},
      {id:'p7h',dir:'in', label:'USB 3 — Mouse',    ctype:'usb'},
      {id:'p7i',dir:'in', label:'USB 4 — Webcam',   ctype:'usb'}
    ]
  },
  {
    id:8, name:'ASUS VG278', sub:'Center monitor · 27" · 144Hz · 1080p', color:'#6366F1',
    x:742, y:40, w:300, type:'display',
    ports:[{id:'p8a',dir:'in',label:'DP In',ctype:'dp'}]
  },
  {
    id:9, name:'Acer XFA240', sub:'Left monitor · 24" · 120Hz · 1080p', color:'#94A3B8',
    x:742, y:180, w:300, type:'display',
    ports:[{id:'p9a',dir:'in',label:'DP In',ctype:'dp'}]
  },
  {
    id:10, name:'Right Monitor', sub:'TBD · 24" · 144Hz · 1080p', color:'#475569',
    x:742, y:320, w:300, type:'display',
    ports:[{id:'p10a',dir:'in',label:'DP In',ctype:'tb'}],
    dashed:true
  },
  {
    id:11, name:'Webcam', sub:'USB camera · mounted on center monitor', color:'#64748B',
    x:350, y:700, w:220, type:'peripheral',
    ports:[{id:'p11a',dir:'out',label:'USB Out',ctype:'usb'}]
  }
];

// Initial cables
const initialCables = [
  {id:301, from:'p1a', to:'p7a', type:'dp'},
  {id:302, from:'p1b', to:'p7b', type:'dp'},
  {id:303, from:'p1c', to:'p10a',type:'tb'},
  {id:304, from:'p2a', to:'p7c', type:'tb'},
  {id:305, from:'p7d', to:'p8a', type:'dp'},
  {id:306, from:'p7e', to:'p9a', type:'dp'},
  {id:307, from:'p3a', to:'p4a', type:'xlr'},
  {id:308, from:'p4b', to:'p7f', type:'usb'},
  {id:309, from:'p5a', to:'p7g', type:'usb'},
  {id:310, from:'p6a', to:'p7h', type:'usb'},
  {id:311, from:'p11a',to:'p7i', type:'usb'},
];

// ═══════════════════════════════════════════
// DEVICE CARD HEIGHT CALC
// ═══════════════════════════════════════════
function cardHeight(dev){
  const headerH = 62;
  const portH   = 28;
  return headerH + dev.ports.length * portH + 10;
}

// ═══════════════════════════════════════════
// PORT POSITIONS (absolute SVG coords)
// ═══════════════════════════════════════════
function portPos(dev, port){
  const idx  = dev.ports.indexOf(port);
  const headerH = 62;
  const portH   = 28;
  const y = dev.y + headerH + idx * portH + portH/2;
  const x = port.dir === 'out' ? dev.x + dev.w : dev.x;
  return {x, y};
}

function getPortById(pid){
  for(const d of devices){
    for(const p of d.ports){
      if(p.id === pid) return {device:d, port:p};
    }
  }
  return null;
}

// ═══════════════════════════════════════════
// RENDER DEVICE CARD (SVG)
// ═══════════════════════════════════════════
function makeSVGEl(tag,attrs={}){
  const el = document.createElementNS('http://www.w3.org/2000/svg',tag);
  for(const [k,v] of Object.entries(attrs)) el.setAttribute(k,v);
  return el;
}

function renderDevice(dev){
  const h = cardHeight(dev);
  const g = makeSVGEl('g',{
    id:`dev-${dev.id}`,
    class:'device-card',
    transform:`translate(0,0)`,
    cursor: mode === 'select' ? 'move' : 'default'
  });

  // Shadow rect
  const shadow = makeSVGEl('rect',{
    x:dev.x+2, y:dev.y+2, width:dev.w, height:h, rx:9,
    fill:'rgba(0,0,0,.4)'
  });

  // Main card
  const bg = makeSVGEl('rect',{
    x:dev.x, y:dev.y, width:dev.w, height:h, rx:9,
    fill:'#1E1E1C', stroke:'rgba(255,255,255,.08)', 'stroke-width':'0.6',
    ...(dev.dashed ? {'stroke-dasharray':'7 4','stroke':'rgba(255,255,255,.15)'} : {})
  });

  // Accent bar
  const accent = makeSVGEl('rect',{
    x:dev.x, y:dev.y, width:dev.w, height:4, rx:2, fill:dev.color
  });

  // Name
  const nameT = makeSVGEl('text',{
    x:dev.x+14, y:dev.y+26,
    'font-size':'12.5', 'font-weight':'700', fill:'#E8E6DF'
  });
  nameT.textContent = dev.name;

  // Sub
  const subT = makeSVGEl('text',{
    x:dev.x+14, y:dev.y+42,
    'font-size':'9', fill:'#78786F'
  });
  subT.textContent = dev.sub.length > 46 ? dev.sub.slice(0,46)+'…' : dev.sub;

  // Divider
  const divider = makeSVGEl('line',{
    x1:dev.x, y1:dev.y+55, x2:dev.x+dev.w, y2:dev.y+55,
    stroke:'rgba(255,255,255,.05)', 'stroke-width':'0.5'
  });

  // Edit button (pencil)
  const editG = makeSVGEl('g',{
    class:'card-actions',
    style:'cursor:pointer',
    opacity:'0'
  });
  const editCirc = makeSVGEl('circle',{
    cx:dev.x+dev.w-14, cy:dev.y+14, r:9, fill:'rgba(0,0,0,.6)', stroke:'rgba(255,255,255,.12)', 'stroke-width':'0.5'
  });
  const editT = makeSVGEl('text',{
    x:dev.x+dev.w-14, y:dev.y+18,
    'text-anchor':'middle', 'font-size':'9', fill:'#A1A1AA'
  });
  editT.textContent = '✎';
  editG.appendChild(editCirc);
  editG.appendChild(editT);
  editG.addEventListener('click', e => { e.stopPropagation(); openEditDevice(dev.id); });

  g.addEventListener('mouseenter', () => {
    bg.setAttribute('stroke', dev.color);
    bg.setAttribute('stroke-width', '1.2');
  });
  g.addEventListener('mouseleave', () => {
    bg.setAttribute('stroke', dev.dashed ? 'rgba(255,255,255,.15)' : 'rgba(255,255,255,.08)');
    bg.setAttribute('stroke-width', '0.6');
  });

  g.appendChild(shadow);
  g.appendChild(bg);
  g.appendChild(accent);
  g.appendChild(nameT);
  g.appendChild(subT);
  g.appendChild(divider);
  g.appendChild(editG);

  // Port rows
  const headerH = 62;
  const portH   = 28;
  dev.ports.forEach((port, idx)=>{
    const py = dev.y + headerH + idx * portH;
    const isOut = port.dir === 'out';
    const px = isOut ? dev.x + dev.w - 10 : dev.x + 10;
    const color = CABLE_COLORS[port.ctype] || '#78786F';

    // Row bg on hover
    const rowBg = makeSVGEl('rect',{
      x:dev.x+1, y:py+1, width:dev.w-2, height:portH-2, rx:3,
      fill:'transparent', style:'cursor:pointer'
    });
    rowBg.addEventListener('mouseenter', ()=>{ rowBg.setAttribute('fill','rgba(255,255,255,.03)'); });
    rowBg.addEventListener('mouseleave', ()=>{ rowBg.setAttribute('fill','transparent'); });

    // Port label
    const lx = isOut ? dev.x + dev.w - 20 : dev.x + 20;
    const labelT = makeSVGEl('text',{
      x:lx, y:py+portH/2+4,
      'text-anchor': isOut ? 'end' : 'start',
      'font-size':'9.5', fill:'#5A5A55'
    });
    labelT.textContent = port.label;
    if(port.note){
      const noteT = makeSVGEl('text',{
        x:isOut ? dev.x+dev.w-22 : dev.x+22,
        y:py+portH/2+4,
        'text-anchor': isOut ? 'end' : 'start',
        'font-size':'8', fill:color, opacity:'.7'
      });
      noteT.textContent = `(${port.note})`;
    }

    // Port dot
    const dotX = isOut ? dev.x + dev.w : dev.x;
    const dotY = py + portH/2;
    const dotR = isTouchDevice ? 8 : 5.5;
    const dot = makeSVGEl('circle',{
      cx:dotX, cy:dotY, r:dotR, fill:color,
      stroke:'rgba(0,0,0,.5)', 'stroke-width':'1',
      style:'cursor:pointer',
      'data-devid':dev.id, 'data-portid':port.id
    });

    dot.addEventListener('mouseenter',()=>{
      dot.setAttribute('r', isTouchDevice ? '10' : '7.5');
      dot.setAttribute('stroke','#fff');
      showTip(dot, `${port.label} (${CABLE_LABELS[port.ctype]||port.ctype})`);
    });
    dot.addEventListener('mouseleave',()=>{
      dot.setAttribute('r', String(dotR));
      dot.setAttribute('stroke','rgba(0,0,0,.5)');
      hideTip();
    });
    dot.addEventListener('click', e=>{
      e.stopPropagation();
      handlePortClick(dev, port, dotX, dotY);
    });

    g.appendChild(rowBg);
    g.appendChild(labelT);
    g.appendChild(dot);
  });

  // Drag setup (select mode) — mouse + touch
  let dragging = false, dx=0, dy=0;
  bg.addEventListener('mousedown', e=>{
    if(mode !== 'select') return;
    e.stopPropagation();
    dragging = true;
    dx = e.clientX - dev.x;
    dy = e.clientY - dev.y;
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
  });
  function onDrag(e){
    if(!dragging) return;
    dev.x = e.clientX - dx;
    dev.y = e.clientY - dy;
    renderAll();
  }
  function stopDrag(){
    dragging = false;
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
  }
  bg.addEventListener('touchstart', e=>{
    if(mode !== 'select') return;
    e.stopPropagation();
    e.preventDefault();
    dragging = true;
    const t = e.touches[0];
    dx = t.clientX - dev.x;
    dy = t.clientY - dev.y;
    document.addEventListener('touchmove', onTouchDrag, {passive:false});
    document.addEventListener('touchend', stopTouchDrag);
  },{passive:false});
  function onTouchDrag(e){
    if(!dragging) return;
    e.preventDefault();
    const t = e.touches[0];
    dev.x = t.clientX - dx;
    dev.y = t.clientY - dy;
    renderAll();
  }
  function stopTouchDrag(){
    dragging = false;
    document.removeEventListener('touchmove', onTouchDrag);
    document.removeEventListener('touchend', stopTouchDrag);
  }

  return g;
}

// ═══════════════════════════════════════════
// RENDER CABLE
// ═══════════════════════════════════════════
function renderCable(cable){
  const fromR = getPortById(cable.from);
  const toR   = getPortById(cable.to);
  if(!fromR || !toR) return null;

  const {x:x1,y:y1} = portPos(fromR.device, fromR.port);
  const {x:x2,y:y2} = portPos(toR.device, toR.port);

  const color = CABLE_COLORS[cable.type] || '#78786F';
  const mx1 = x1 + (x2>x1?80:-80);
  const mx2 = x2 + (x2>x1?-80:80);

  const path = makeSVGEl('path',{
    id:`cable-${cable.id}`,
    d:`M${x1},${y1} C${mx1},${y1} ${mx2},${y2} ${x2},${y2}`,
    fill:'none', stroke:color,
    'stroke-width': cable === selectedCable ? '3.5' : '2',
    'stroke-linecap':'round',
    'marker-end': CABLE_MARKERS[cable.type] || CABLE_MARKERS.dp,
    ...(cable.type==='tb'&&cable.dashed?{'stroke-dasharray':'6 3'}:{}),
    style:'cursor:pointer'
  });

  path.addEventListener('mouseenter',()=>{
    if(cable !== selectedCable) path.setAttribute('stroke-width','3.5');
    showTip(path, `${CABLE_LABELS[cable.type]} — ${fromR.device.name} → ${toR.device.name}`);
  });
  path.addEventListener('mouseleave',()=>{
    if(cable !== selectedCable) path.setAttribute('stroke-width', cable===selectedCable?'3.5':'2');
    hideTip();
  });
  path.addEventListener('click', e=>{
    e.stopPropagation();
    selectCable(cable);
  });

  return path;
}

// ═══════════════════════════════════════════
// RENDER ALL
// ═══════════════════════════════════════════
function renderAll(){
  // Clear
  while(cableLayer.firstChild) cableLayer.removeChild(cableLayer.firstChild);
  while(deviceLayer.firstChild) deviceLayer.removeChild(deviceLayer.firstChild);

  // Cables
  for(const cable of cables){
    const el = renderCable(cable);
    if(el) cableLayer.appendChild(el);
  }

  // Devices
  for(const dev of devices){
    deviceLayer.appendChild(renderDevice(dev));
  }
}

// ═══════════════════════════════════════════
// PORT CLICK — DRAW CABLES
// ═══════════════════════════════════════════
function handlePortClick(dev, port, px, py){
  if(mode !== 'draw') return;

  if(!drawState){
    // Start draw
    drawState = { device:dev, port, x:px, y:py };
    const prev = document.getElementById('preview-cable');
    prev.setAttribute('x1', px);
    prev.setAttribute('y1', py);
    prev.setAttribute('x2', px);
    prev.setAttribute('y2', py);
    prev.setAttribute('display','block');
    document.getElementById('draw-hint').style.display='block';
    document.getElementById('draw-hint').textContent='Click a destination port to connect — Esc to cancel';
    setStatus('Drawing connection from ' + dev.name + ' · ' + port.label + ' — click destination port');
  } else {
    // Complete draw — check it's a different port
    if(drawState.port.id === port.id) return;
    pendingCable = {
      fromDevice: drawState.device, fromPort: drawState.port,
      fromX: drawState.x, fromY: drawState.y,
      toDevice: dev, toPort: port,
      toX: px, toY: py
    };
    drawState = null;
    document.getElementById('preview-cable').setAttribute('display','none');
    document.getElementById('draw-hint').style.display='none';
    openModal('modal-cable');
  }
}

// ═══════════════════════════════════════════
// CABLE FINISH
// ═══════════════════════════════════════════
function finishCable(type){
  if(!pendingCable) return;
  const cable = {
    id: cableIdCounter++,
    from: pendingCable.fromPort.id,
    to:   pendingCable.toPort.id,
    type
  };
  cables.push(cable);
  pendingCable = null;
  closeModal('modal-cable');
  renderAll();
  setStatus('Cable added. Click a port to draw another connection.');
}

function cancelCableDraw(){
  drawState = null;
  pendingCable = null;
  document.getElementById('preview-cable').setAttribute('display','none');
  document.getElementById('draw-hint').style.display='none';
  closeModal('modal-cable');
  setStatus('Draw mode — click an output port to start a cable connection');
}

// Preview cable follows mouse / finger
svg.addEventListener('mousemove', e=>{
  if(!drawState) return;
  const rect = svg.getBoundingClientRect();
  const scaleX = 2400 / rect.width;
  const scaleY = 1200 / rect.height;
  const mx = (e.clientX - rect.left) * scaleX;
  const my = (e.clientY - rect.top)  * scaleY;
  const prev = document.getElementById('preview-cable');
  prev.setAttribute('x2', mx);
  prev.setAttribute('y2', my);
});
svg.addEventListener('touchmove', e=>{
  if(!drawState) return;
  e.preventDefault();
  const t = e.touches[0];
  const rect = svg.getBoundingClientRect();
  const scaleX = 2400 / rect.width;
  const scaleY = 1200 / rect.height;
  const mx = (t.clientX - rect.left) * scaleX;
  const my = (t.clientY - rect.top)  * scaleY;
  const prev = document.getElementById('preview-cable');
  prev.setAttribute('x2', mx);
  prev.setAttribute('y2', my);
},{passive:false});

svg.addEventListener('click', e=>{
  if(e.target === svg || e.target.tagName === 'rect' && !e.target.closest('[data-devid]')){
    if(selectedCable){
      selectedCable = null;
      document.getElementById('btn-del-cable').style.display='none';
      renderAll();
    }
  }
});

document.addEventListener('keydown', e=>{
  if(e.key === 'Escape'){
    cancelCableDraw();
    if(selectedCable){
      selectedCable=null;
      document.getElementById('btn-del-cable').style.display='none';
      renderAll();
    }
  }
  if((e.key==='Delete'||e.key==='Backspace') && selectedCable){
    deleteSelected();
  }
});

// ═══════════════════════════════════════════
// SELECT CABLE
// ═══════════════════════════════════════════
function selectCable(cable){
  selectedCable = cable;
  document.getElementById('btn-del-cable').style.display='';
  setStatus(`Selected: ${CABLE_LABELS[cable.type]} cable — press Delete or click "Delete selected" to remove`);
  renderAll();
}

function deleteSelected(){
  if(selectedCable){
    cables = cables.filter(c=>c!==selectedCable);
    selectedCable = null;
    document.getElementById('btn-del-cable').style.display='none';
    renderAll();
    setStatus('Cable deleted.');
  }
}

// ═══════════════════════════════════════════
// MODE
// ═══════════════════════════════════════════
function setMode(m){
  mode = m;
  if(m==='draw'){
    svg.className.baseVal = 'draw-mode';
    document.getElementById('btn-draw').classList.add('active');
    document.getElementById('btn-select').classList.remove('active');
    setStatus('Draw mode — click an output port to start a cable connection');
  } else {
    svg.className.baseVal = 'select-mode';
    document.getElementById('btn-select').classList.add('active');
    document.getElementById('btn-draw').classList.remove('active');
    cancelCableDraw();
    setStatus('Select mode — click and drag devices to reposition them');
  }
  renderAll();
}

// ═══════════════════════════════════════════
// ADD DEVICE (from palette)
// ═══════════════════════════════════════════
function addDevice(type, name, color){
  const newDev = {
    id: deviceIdCounter++,
    name, sub: type,
    color, x:370, y:420,
    w: 240, type,
    ports:[
      {id:`p${deviceIdCounter}a`, dir:'out', label:'Out 1', ctype:'dp'},
      {id:`p${deviceIdCounter}b`, dir:'in',  label:'In 1',  ctype:'dp'}
    ]
  };
  devices.push(newDev);
  renderAll();
  switchTab('setup');
  setStatus(`Added "${name}" to canvas. Switch to Select mode to reposition it.`);
  // Auto-open edit
  setTimeout(()=>openEditDevice(newDev.id),200);
}

// ═══════════════════════════════════════════
// ADD / EDIT DEVICE MODAL
// ═══════════════════════════════════════════
function openAddDevice(){
  switchTab('add');
}

function openEditDevice(id){
  const dev = devices.find(d=>d.id===id);
  if(!dev) return;
  editingDeviceId = id;
  pickedColor = dev.color;
  document.getElementById('modal-device-title').textContent = 'Edit device';
  document.getElementById('d-name').value = dev.name;
  document.getElementById('d-sub').value = dev.sub;
  document.getElementById('d-del-btn').style.display = '';
  // Ports text
  document.getElementById('d-ports').value = dev.ports.map(p=>`${p.dir==='out'?'Out':'In'} · ${p.label} · ${p.ctype}`).join('\n');
  highlightColor(pickedColor);
  openModal('modal-device');
}

function pickColor(c, el){
  pickedColor = c;
  highlightColor(c);
}
function highlightColor(c){
  document.querySelectorAll('.color-swatch').forEach(s=>{
    s.style.borderColor = s.dataset.c===c ? '#fff' : 'transparent';
    s.style.transform   = s.dataset.c===c ? 'scale(1.2)' : 'scale(1)';
  });
}

function saveDevice(){
  const name = document.getElementById('d-name').value.trim();
  if(!name){ alert('Device name required'); return; }
  const sub   = document.getElementById('d-sub').value.trim();
  const rawPorts = document.getElementById('d-ports').value.trim().split('\n').filter(Boolean);
  const ports = rawPorts.map((line,i)=>{
    const parts = line.split('·').map(s=>s.trim());
    const dir   = (parts[0]||'out').toLowerCase().startsWith('out') ? 'out' : 'in';
    const label = parts[1] || `Port ${i+1}`;
    const ctype = (parts[2]||'dp').toLowerCase();
    return { id: `p${deviceIdCounter}_${i}`, dir, label, ctype };
  });

  if(editingDeviceId!==null){
    const dev = devices.find(d=>d.id===editingDeviceId);
    if(dev){
      dev.name  = name;
      dev.sub   = sub;
      dev.color = pickedColor;
      dev.ports = ports.length ? ports : dev.ports;
    }
  } else {
    devices.push({
      id:deviceIdCounter++, name, sub, color:pickedColor,
      x:380, y:440, w:260, type:'source', ports
    });
  }
  editingDeviceId=null;
  closeModal('modal-device');
  renderAll();
}

function deleteDevice(){
  if(editingDeviceId===null) return;
  devices = devices.filter(d=>d.id!==editingDeviceId);
  cables  = cables.filter(c=>{
    const fr=getPortById(c.from), to=getPortById(c.to);
    return fr && to;
  });
  editingDeviceId=null;
  closeModal('modal-device');
  renderAll();
}

// ═══════════════════════════════════════════
// ADD SETUP ITEM
// ═══════════════════════════════════════════
function openAddSetupItem(){
  openModal('modal-setup');
}

function saveSetupItem(){
  const name = document.getElementById('si-name').value.trim();
  if(!name){ alert('Name required'); return; }
  const meta = document.getElementById('si-meta').value.trim();
  const tag  = document.getElementById('si-tag').value;

  const row = document.createElement('div');
  row.className = 'setup-row';
  row.innerHTML = `<div class="sdot" style="background:#94A3B8"></div><span class="sname">${name}</span>${tag?`<span class="stag ${tag}">${tag==='t-own'?'owned':tag==='t-tbd'?'TBD':'buy'}</span>`:''}`;

  const addBtn = document.getElementById('sidebar-setup').querySelector('.add-btn');
  document.getElementById('sidebar-setup').insertBefore(row, addBtn);

  if(meta){
    const metaEl = document.createElement('div');
    metaEl.className='smeta';
    metaEl.textContent=meta;
    document.getElementById('sidebar-setup').insertBefore(metaEl, addBtn);
  }

  closeModal('modal-setup');
  saveState(); // persist sidebar
}

// ═══════════════════════════════════════════
// TOGGLE CABLES / LABELS
// ═══════════════════════════════════════════
let cablesVisible=true, labelsVisible=true;
function toggleCables(){
  cablesVisible=!cablesVisible;
  cableLayer.style.opacity=cablesVisible?1:0.08;
  document.getElementById('btn-cables').textContent=cablesVisible?'Dim cables':'Show cables';
  document.getElementById('btn-cables').classList.toggle('active',!cablesVisible);
}
function toggleLabels(){
  labelsVisible=!labelsVisible;
  // Toggle port label text opacity
  document.querySelectorAll('#device-layer text').forEach(t=>{
    if(t.getAttribute('font-size')==='9.5'||t.getAttribute('font-size')==='9'){
      t.style.opacity=labelsVisible?1:0;
    }
  });
  document.getElementById('btn-labels').textContent=labelsVisible?'Dim labels':'Show labels';
  document.getElementById('btn-labels').classList.toggle('active',!labelsVisible);
}

// ═══════════════════════════════════════════
// TABS
// ═══════════════════════════════════════════
function switchTab(tab){
  document.getElementById('sidebar-setup').style.display = tab==='setup'?'':'none';
  document.getElementById('sidebar-add').style.display  = tab==='add'?'':'none';
  document.getElementById('tab-setup').classList.toggle('on',tab==='setup');
  document.getElementById('tab-add').classList.toggle('on',tab==='add');
}

// ═══════════════════════════════════════════
// MODAL HELPERS
// ═══════════════════════════════════════════
function openModal(id){
  document.getElementById(id).classList.add('show');
}
function closeModal(id){
  document.getElementById(id).classList.remove('show');
}
// Close modal on overlay click
document.querySelectorAll('.overlay').forEach(o=>{
  o.addEventListener('click',e=>{
    if(e.target===o){
      o.classList.remove('show');
      cancelCableDraw();
    }
  });
});

// ═══════════════════════════════════════════
// TOOLTIP
// ═══════════════════════════════════════════
const tip = document.getElementById('cable-tip');
function showTip(el, text){
  tip.textContent = text;
  tip.style.display='block';
  document.addEventListener('mousemove', moveTip);
}
function hideTip(){
  tip.style.display='none';
  document.removeEventListener('mousemove', moveTip);
}
function moveTip(e){
  tip.style.left = (e.clientX+14)+'px';
  tip.style.top  = (e.clientY-28)+'px';
}

// ═══════════════════════════════════════════
// STATUS
// ═══════════════════════════════════════════
function setStatus(msg){
  document.getElementById('status-text').textContent = msg;
}

// ═══════════════════════════════════════════
// LOCALSTORAGE PERSISTENCE
// ═══════════════════════════════════════════
const LS_KEY  = 'homestation_v6';
const LS_SIDE = 'homestation_v6_sidebar';

// Save canvas state (devices + cables + counters)
function saveState(){
  try {
    const state = {
      devices,
      cables,
      deviceIdCounter,
      cableIdCounter,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(LS_KEY, JSON.stringify(state));

    // Save sidebar HTML (setup panel only)
    const sideHTML = document.getElementById('sidebar-setup').innerHTML;
    localStorage.setItem(LS_SIDE, sideHTML);

    // Update saved indicator
    const el = document.getElementById('save-indicator');
    if(el){
      const t = new Date();
      el.textContent = `Saved ${t.getHours().toString().padStart(2,'0')}:${t.getMinutes().toString().padStart(2,'0')}`;
      el.style.color = '#4ADE80';
      setTimeout(()=>{ el.style.color = 'var(--text-3)'; }, 2000);
    }
  } catch(e){
    console.warn('Save failed:', e);
  }
}

// Load canvas state
function loadState(){
  try {
    const raw = localStorage.getItem(LS_KEY);
    if(raw){
      const state = JSON.parse(raw);
      devices           = state.devices          || initialDevices;
      cables            = state.cables           || initialCables;
      deviceIdCounter   = state.deviceIdCounter  || 100;
      cableIdCounter    = state.cableIdCounter   || 200;
      // Show last saved time
      if(state.savedAt){
        const d = new Date(state.savedAt);
        const el = document.getElementById('save-indicator');
        if(el) el.textContent = `Last saved ${d.toLocaleDateString()} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
      }
      return true;
    }
  } catch(e){
    console.warn('Load failed:', e);
  }
  return false;
}

// Load sidebar HTML
function loadSidebar(){
  try {
    const raw = localStorage.getItem(LS_SIDE);
    if(raw){
      document.getElementById('sidebar-setup').innerHTML = raw;
    }
  } catch(e){
    console.warn('Sidebar load failed:', e);
  }
}

// Reset to defaults — clears localStorage and reloads
function resetToDefaults(){
  if(!confirm('Reset everything to defaults? This will clear all your devices, cables, and setup items. This cannot be undone.')) return;
  localStorage.removeItem(LS_KEY);
  localStorage.removeItem(LS_SIDE);
  location.reload();
}

// ─── Wrap renderAll to autosave after every render ───
const _renderAll = renderAll;
function renderAllAndSave(){
  _renderAll();
  saveState();
}

// Override renderAll globally
window.renderAll = renderAllAndSave;

// ═══════════════════════════════════════════
// SIDEBAR TOGGLE (mobile)
// ═══════════════════════════════════════════
function toggleSidebar(){
  const sidebar = document.querySelector('.sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  const isOpen = sidebar.classList.contains('open');
  sidebar.classList.toggle('open', !isOpen);
  backdrop.classList.toggle('show', !isOpen);
}

function closeSidebar(){
  document.querySelector('.sidebar').classList.remove('open');
  document.getElementById('sidebar-backdrop').classList.remove('show');
}

// ═══════════════════════════════════════════
// INIT — load from localStorage or use defaults
// ═══════════════════════════════════════════
const hadSavedState = loadState();
if(!hadSavedState){
  devices = initialDevices;
  cables  = initialCables;
}
loadSidebar();
renderAll();
setStatus(hadSavedState
  ? 'Loaded your saved setup — all devices, cables, and positions restored'
  : 'Draw mode — click an output port to start a cable connection'
);

// ── Mobile init: abbreviate button text and sync save indicator ──
if(window.innerWidth <= 768){
  document.getElementById('btn-draw').textContent = 'Draw';
  document.getElementById('btn-select').textContent = 'Move';
  const addBtn = document.getElementById('btn-add-device');
  if(addBtn) addBtn.textContent = '+ Add';
  const delBtn = document.getElementById('btn-del-cable');
  if(delBtn) delBtn.textContent = 'Delete';
}

// Sync mobile save indicator with main save indicator
const _saveState = saveState;
function saveState(){
  _saveState();
  const main = document.getElementById('save-indicator');
  const mob  = document.getElementById('save-indicator-mobile');
  if(main && mob) mob.textContent = main.textContent;
}
window.saveState = saveState;

// On mobile, open sidebar when "Add device" is tapped
const origOpenAddDevice = openAddDevice;
function openAddDevice(){
  origOpenAddDevice();
  if(window.innerWidth <= 768){
    document.querySelector('.sidebar').classList.add('open');
    document.getElementById('sidebar-backdrop').classList.add('show');
  }
}
window.openAddDevice = openAddDevice;
