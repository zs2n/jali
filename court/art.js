/* جَلِيّ — Mock court pixel art (480×270).
   Everything is drawn in code from small palettes: no image files, no libraries.
   Public API (window.JaliCourtArt):
     W, H                         canvas size
     CAST                         character art specs, keyed by id
     scene(ctx, view, o)          draw a full view; o = {who, st, gavelT, now, cast:{client,witness}}
     portrait(canvas, id, expr)   head-and-shoulders crop for name plates and case cards
     doc(canvas, kind)            pixel document thumbnail (contract, letter, table, bank, release, email)
     sheet(ctx, ids, expr, pose)  development helper used for review screenshots */
(function(){
  'use strict';
  var W = 480, H = 270, g = null;

  /* ---------- primitives ---------- */
  function R(x,y,w,h,c){ if(w<=0||h<=0) return; g.fillStyle=c; g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h)); }
  function P(x,y,c){ g.fillStyle=c; g.fillRect(Math.round(x),Math.round(y),1,1); }
  function dith(x,y,w,h,c,ph){ x=Math.round(x); y=Math.round(y); g.fillStyle=c; for(var j=0;j<h;j++) for(var i=((j+(ph||0))&1);i<w;i+=2) g.fillRect(x+i,y+j,1,1); }
  function sparse(x,y,w,h,c,ph){ x=Math.round(x); y=Math.round(y); g.fillStyle=c; for(var j=0;j<h;j+=2) for(var i=(((j>>1)&1)*2+(ph||0))%4;i<w;i+=4) g.fillRect(x+i,y+j,1,1); }
  function spans(y0,y1,f,c){ g.fillStyle=c; for(var y=Math.round(y0);y<y1;y++){ var s=f(y); if(s && s[1]>s[0]) g.fillRect(Math.round(s[0]),y,Math.round(s[1])-Math.round(s[0]),1); } }
  function ell(cx,cy,rx,ry,c){ spans(Math.round(cy-ry),Math.round(cy+ry)+1,function(y){ var d=(y-cy)/ry; if(d*d>1) return null; var w=rx*Math.sqrt(1-d*d); return [cx-w,cx+w]; },c); }
  function line(x0,y0,x1,y1,w,c){ var n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0))|0||1; g.fillStyle=c; for(var k=0;k<=n;k++){ var t=k/n; g.fillRect(Math.round(x0+(x1-x0)*t-w/2),Math.round(y0+(y1-y0)*t-w/2),w,w); } }
  function poly(pts,c){ polyF(pts,null,c); }
  function polyF(pts,fn,c){
    var minY=1e9,maxY=-1e9,i;
    for(i=0;i<pts.length;i++){ if(pts[i][1]<minY) minY=pts[i][1]; if(pts[i][1]>maxY) maxY=pts[i][1]; }
    if(c) g.fillStyle=c;
    for(var y=Math.ceil(minY); y<maxY; y++){
      var xs=[];
      for(i=0;i<pts.length;i++){ var a=pts[i], b=pts[(i+1)%pts.length]; if((a[1]<=y&&b[1]>y)||(b[1]<=y&&a[1]>y)) xs.push(a[0]+(y-a[1])*(b[0]-a[0])/(b[1]-a[1])); }
      xs.sort(function(p,q){ return p-q; });
      for(var k=0;k+1<xs.length;k+=2){
        var x0=Math.round(xs[k]), x1=Math.round(xs[k+1]);
        if(!fn){ if(x1>x0) g.fillRect(x0,y,x1-x0,1); }
        else for(var x=x0;x<x1;x++){ var col=fn(x,y); if(col){ g.fillStyle=col; g.fillRect(x,y,1,1); } }
      }
    }
  }
  function hash(x,y){ var h=(x*374761393 + y*668265263)|0; h=(h^(h>>>13))*1274126177|0; return ((h^(h>>>16))>>>0)/4294967295; }

  /* ---------- palettes ---------- */
  var WOOD = ['#170D07','#24150B','#352010','#4A2D17','#62401F','#7E5530','#9C6E42'];
  var EM   = ['#03140E','#062018','#0A2E22','#0F4030','#16573F','#20744F','#36946A','#5AB78C'];
  var GOLD = ['#4A3518','#6E5224','#957234','#B8975A','#D4B77A','#ECD8A6','#FFF4D2'];
  var IVORY= ['#8F8775','#ADA48F','#C9C0AA','#DED6C3','#EEE8DA','#FAF7EF'];
  var INK  = '#0B0807';
  var SKIN = { light:['#F3D3B4','#E2B48D','#C8946C','#A6734F','#7E5438'],
               medium:['#E0AE84','#CB956A','#AE7850','#8C5C3B','#6A4229'],
               tan:['#CF9466','#B87C4E','#966039','#744628','#55321C'],
               deep:['#AF7449','#945E38','#784A2A','#5A351D','#3F2414'] }; /* hi, base, shade, deep, line */
  var THOBE = ['#A9A397','#C8C3B8','#E2DFD8','#F2F0EB','#FDFCF9'];
  var GHUTRA= ['#B4AEA2','#D0CBC1','#E9E6DF','#F6F4EF','#FFFFFF'];
  var SHEMAGH_RED = ['#6E1813','#962620','#B8352B','#D24B3E'];
  var BUILD = { thin:74, slim:80, normal:88, broad:96, heavy:104 };

  /* ---------- cast: every character has its own silhouette, outfit, face and palette ---------- */
  var CAST = {
    judge:  { skin:'medium', build:'broad', face:'square', fw:32, head:'shemagh', agal:false, outfit:'bisht',
              robe:['#070605','#0F0D0B','#1A1714','#27221E','#38312A'], trim:'heavy', beard:'full', beardC:['#8A847A','#ACA69C','#D6D1C8'],
              brow:3, browC:'#C7C0B4', glasses:'half', eyes:'deep', nose:'long', age:3, pen:true },
    player: { skin:'medium', build:'slim', face:'oval', fw:30, head:'shemagh', agal:true, peak:true, pleats:true, outfit:'bisht',
              robe:['#040706','#09110D','#102019','#183027','#224436'], trim:'fine', beard:'trim', beardC:['#120C08','#1E150F','#3A2B20'],
              brow:2, browC:'#160F0B', eyes:'keen', nose:'straight', age:1 },
    rival:  { skin:'tan', build:'heavy', face:'round', fw:34, head:'shemagh', agal:true, outfit:'bisht',
              robe:['#3B2614','#55381E','#73502B','#8F693A','#AA824E'], trim:'fine', beard:'goatee', beardC:['#140D09','#21170F','#3E2E22'],
              brow:2, browC:'#1A120C', glasses:'rect', eyes:'hooded', nose:'wide', age:2, ring:true },
    clerk:  { skin:'light', build:'thin', face:'long', fw:27, head:'ghutra', agal:true, hang:'back', outfit:'vest',
              vest:['#1D2321','#2A312E','#38403C','#48514C'], beard:'stubble', beardC:['#2E2119','#3E2E22','#5A4636'],
              brow:1, browC:'#2A1E17', glasses:'round', eyes:'normal', nose:'straight', age:0, pen:true },
    salem:  { skin:'tan', build:'normal', face:'square', fw:31, head:'shemagh', agal:true, hang:'both', outfit:'thobe',
              beard:'full', beardC:['#0E0906','#1A110C','#36271C'], brow:3, browC:'#130D09', eyes:'soft', nose:'wide', age:2, misbaha:true },
    khalid: { skin:'light', build:'slim', face:'oval', fw:29, head:'ghutra', agal:true, hang:'front', outfit:'thobe',
              thobe:['#8E948F','#A9AFAA','#C3C8C3','#D6DAD5','#E8EBE7'], beard:'goatee', beardC:['#1E1510','#2C2018','#4A382A'],
              brow:2, browC:'#22180F', glasses:'square', eyes:'normal', nose:'straight', age:1, badge:true },
    nasser: { skin:'medium', build:'slim', face:'oval', fw:26, head:'niqab', veil:['#040405','#09090B','#111114','#1A1A1F','#2A2A31'], outfit:'abaya',
              robe:['#060607','#0D0D0F','#16161A','#202025','#2C2C33'], embroid:['#2A2A31','#5A5A64'], beard:'none', brow:1, browC:'#24170F', eyes:'lash', nose:'small', age:0 },
    abdullah:{ skin:'tan', build:'slim', face:'oval', fw:26, head:'niqab', veil:['#040405','#09090B','#111114','#1A1A1F','#2A2A31'], outfit:'abaya',
              robe:['#060607','#0D0D0F','#16161A','#202025','#2C2C33'], embroid:['#0F4030','#D4B77A'], beard:'none', brow:1, browC:'#24170F', eyes:'lash', nose:'small', age:0, hold:'folder' },
    reem:   { skin:'light', build:'slim', face:'oval', fw:26, head:'niqab', veil:['#040405','#09090B','#111114','#1A1A1F','#2A2A31'], outfit:'abaya',
              robe:['#060607','#0D0D0F','#16161A','#202025','#2C2C33'], embroid:[EM[5],GOLD[4]], beard:'none', brow:1, browC:'#24170F',
              eyes:'lash', nose:'small', age:0, hold:'folder' },
    saad:   { skin:'tan', build:'normal', face:'oval', fw:30, head:'wrap', outfit:'hivis', beard:'short', beardC:['#120C08','#1E150F','#3A2B20'],
              brow:2, browC:'#160F0B', eyes:'normal', nose:'straight', age:1 },
    hind:   { skin:'medium', build:'slim', face:'oval', fw:26, head:'niqab', veil:['#040405','#09090B','#111114','#1A1A1F','#2A2A31'], outfit:'abaya',
              robe:['#060607','#0D0D0F','#16161A','#202025','#2C2C33'], embroid:['#59627A','#A9B0C2'], beard:'none', brow:1, browC:'#2A1B12',
              glasses:'round', eyes:'lash', nose:'small', age:2, badge:true },
    fahd:   { skin:'medium', build:'slim', face:'oval', fw:29, head:'hair', hairC:['#0D0907','#1A130E','#2C2219'], curly:true, outfit:'shirt',
              shirt:['#2F3A2C','#404D3C','#56654F','#6E7F66','#8B9C82'], beard:'stubble', beardC:['#2A1E16','#3A2A20','#56412F'],
              brow:2, browC:'#1C140E', eyes:'normal', nose:'straight', age:0, badge:true }
  };

  /* Expression vocabulary shared by everyone */
  var EXPR = {
    normal:  {eyes:'n', brow:'n', mouth:'closed'},
    listen:  {eyes:'n', brow:'n', mouth:'closed', look:-1},
    think:   {eyes:'n', brow:'think', mouth:'side', look:1, lookY:-1, fx:'dots'},
    worried: {eyes:'n', brow:'worried', mouth:'frown'},
    sweat:   {eyes:'n', brow:'worried', mouth:'wavy', look:1, fx:'sweat'},
    nervous: {eyes:'n', brow:'worried', mouth:'wavy', look:1, fx:'sweat'},
    shock:   {eyes:'wide', brow:'raised', mouth:'shout', fx:'glint'},
    angry:   {eyes:'narrow', brow:'angry', mouth:'teeth', fx:'vein'},
    happy:   {eyes:'happy', brow:'soft', mouth:'smile', fx:'blush'},
    stern:   {eyes:'narrow', brow:'stern', mouth:'flat'},
    smug:    {eyes:'narrow', brow:'smug', mouth:'smug'},
    confident:{eyes:'n', brow:'n', mouth:'smile'},
    judgment:{eyes:'narrow', brow:'stern', mouth:'closed'}
  };
  var DEFAULT_EXPR = { rival:'smug', player:'confident' };

  /* ---------- body ---------- */
  function bodyOutline(cx, sy, hw){
    return [[cx-13,sy-5],[cx-hw+12,sy-1],[cx-hw+2,sy+6],[cx-hw-2,sy+20],[cx-hw-5,sy+60],[cx-hw-7,H+2],
            [cx+hw+7,H+2],[cx+hw+5,sy+60],[cx+hw+2,sy+20],[cx+hw-2,sy+6],[cx+hw-12,sy-1],[cx+13,sy-5]];
  }
  function shadeBody(cx, sy, hw, pal){ /* pal: deep, shade, base, light, hi */
    poly(bodyOutline(cx,sy,hw), pal[2]);
    poly([[cx+hw*0.35,sy+2],[cx+hw-4,sy+4],[cx+hw+3,sy+22],[cx+hw+7,H+2],[cx+hw*0.25,H+2]], pal[1]);
    poly([[cx+hw-2,sy+12],[cx+hw+3,sy+22],[cx+hw+7,H+2],[cx+hw+1,H+2]], pal[0]);
    dith(cx+hw*0.25-2, sy+30, 3, H-sy-30, pal[1]);
    dith(cx-hw+3, sy+8, 6, 26, pal[3]);
    R(cx-hw+1, sy+4, 10, 2, pal[3]);
    line(cx-hw+13, sy+24, cx-hw+9, H, 1, pal[1]);
    line(cx+hw-13, sy+24, cx+hw-8, H, 1, pal[0]);
  }
  function thobe(sp, cx, sy, hw){
    var pal = sp.thobe || THOBE;
    shadeBody(cx, sy, hw, pal);
    for(var k=0;k<3;k++){ var fx = cx-hw+24+k*22; line(fx, sy+44+k*6, fx-2, H, 1, pal[1]); }
  }
  function collar(sp, cx, sy, pal){
    pal = pal || sp.thobe || THOBE;
    R(cx-10, sy-7, 20, 5, pal[2]); R(cx-10, sy-3, 20, 1, pal[0]); R(cx-10, sy-7, 20, 1, pal[3]);
    R(cx+5, sy-6, 5, 3, pal[1]);
    R(cx, sy-2, 1, 36, pal[1]); R(cx-1, sy-2, 1, 36, pal[3]);
    R(cx-1, sy+5, 3, 2, GOLD[4]); P(cx-1, sy+5, GOLD[5]); R(cx-1, sy+16, 3, 2, GOLD[4]); P(cx-1, sy+16, GOLD[5]);
  }
  function bisht(sp, cx, sy, hw){
    var r = sp.robe, o = 6;
    var L = [[cx-12,sy-8],[cx-hw+10,sy-3],[cx-hw-1,sy+6],[cx-hw-6,sy+24],[cx-hw-10,sy+70],[cx-hw-14,H+2],[cx-24,H+2],[cx-15,sy+28],[cx-11,sy+4]];
    var Rr= [[cx+12,sy-8],[cx+hw-10,sy-3],[cx+hw+1,sy+6],[cx+hw+6,sy+24],[cx+hw+10,sy+70],[cx+hw+14,H+2],[cx+24,H+2],[cx+15,sy+28],[cx+11,sy+4]];
    poly(L, r[2]); poly(Rr, r[1]);
    poly([[cx+hw-2,sy+10],[cx+hw+6,sy+24],[cx+hw+14,H+2],[cx+hw+4,H+2]], r[0]);
    dith(cx-hw+o-2, sy+4, 8, 60, r[3]); sparse(cx-hw+o-3, sy+64, 8, H-sy-64, r[3]);
    R(cx-hw+8, sy-1, 14, 2, r[3]); dith(cx-hw+6, sy+1, 18, 3, r[4]);
    line(cx-15, sy+30, cx-24, H, 1, r[0]); line(cx+15, sy+30, cx+24, H, 1, r[0]);
    line(cx-hw+16, sy+30, cx-hw+10, H, 1, r[1]); line(cx+hw-12, sy+34, cx+hw-6, H, 1, r[0]);
    if(sp.trim && sp.trim!=='none'){
      var w = sp.trim==='heavy' ? 4 : 3;
      line(cx-12, sy-6, cx-11, sy+4, w, GOLD[2]); line(cx-11, sy+4, cx-15, sy+28, w, GOLD[2]); line(cx-15, sy+28, cx-24, H, w, GOLD[2]);
      line(cx+12, sy-6, cx+11, sy+4, w, GOLD[1]); line(cx+11, sy+4, cx+15, sy+28, w, GOLD[1]); line(cx+15, sy+28, cx+24, H, w, GOLD[1]);
      for(var y=sy-6; y<H; y+=3){
        var t=(y-sy)/(H-sy), xl = y<sy+4 ? cx-12 : y<sy+28 ? cx-11-(y-sy-4)/6 : cx-15-(y-sy-28)*9/(H-sy-28);
        P(xl, y, GOLD[5]); P(2*cx-xl, y, GOLD[3]);
        if(sp.trim==='heavy') { P(xl-1, y+1, GOLD[4]); P(2*cx-xl+1, y+1, GOLD[2]); }
      }
      line(cx-12, sy-7, cx-hw+10, sy-3, 2, GOLD[2]); line(cx+12, sy-7, cx+hw-10, sy-3, 2, GOLD[1]);
    }
  }
  function vest(sp, cx, sy, hw){
    var v = sp.vest;
    var L = [[cx-11,sy-3],[cx-hw+8,sy+2],[cx-hw+4,sy+14],[cx-hw+3,H+2],[cx-9,H+2],[cx-7,sy+22]];
    var Rr= [[cx+11,sy-3],[cx+hw-8,sy+2],[cx+hw-4,sy+14],[cx+hw-3,H+2],[cx+9,H+2],[cx+7,sy+22]];
    poly(L, v[2]); poly(Rr, v[1]); dith(cx-hw+6, sy+10, 6, 50, v[3]);
    line(cx-7, sy+22, cx-9, H, 1, v[0]); line(cx+7, sy+22, cx+9, H, 1, v[0]);
    for(var y=sy+28; y<H; y+=11){ R(cx-11, y, 2, 2, GOLD[3]); P(cx-11,y,GOLD[5]); }
    line(cx-hw+12, sy+40, cx-hw+20, sy+40, 1, v[0]); line(cx+hw-20, sy+46, cx+hw-12, sy+46, 1, v[0]);
  }
  function coverall(sp, cx, sy, hw){
    var c = sp.cov;
    shadeBody(cx, sy, hw, c);
    poly([[cx-12,sy-6],[cx-2,sy+12],[cx-14,sy+8],[cx-20,sy-2]], c[3]); poly([[cx+12,sy-6],[cx+2,sy+12],[cx+14,sy+8],[cx+20,sy-2]], c[2]);
    line(cx-12,sy-6,cx-2,sy+12,1,c[0]); line(cx+12,sy-6,cx+2,sy+12,1,c[0]);
    R(cx, sy+10, 1, H-sy-10, '#8E9AA3'); R(cx+1, sy+10, 1, H-sy-10, c[0]);
    R(cx-hw+16, sy+24, 20, 16, c[1]); R(cx-hw+16, sy+24, 20, 4, c[3]); R(cx-hw+16, sy+28, 20, 1, c[0]);
    R(cx+12, sy+22, 16, 8, '#0F4030'); R(cx+13, sy+23, 14, 6, '#16573F'); R(cx+18, sy+24, 4, 4, GOLD[4]);
    var ry = sy+54;
    R(cx-hw-1, ry, hw*2+2, 6, '#9FA9AE'); R(cx-hw-1, ry+1, hw*2+2, 2, '#E3EAED'); R(cx-hw-1, ry+5, hw*2+2, 1, c[0]); R(cx-hw-1, ry-1, hw*2+2, 1, c[0]);
    dith(cx-hw-1, ry+3, hw*2+2, 2, '#C6D0D4');
  }
  function shirt(sp, cx, sy, hw){
    var c = sp.shirt;
    shadeBody(cx, sy, hw, c);
    poly([[cx-11,sy-6],[cx-1,sy+10],[cx-12,sy+8],[cx-18,sy-1]], c[3]); poly([[cx+11,sy-6],[cx+1,sy+10],[cx+12,sy+8],[cx+18,sy-1]], c[2]);
    R(cx-1, sy+8, 2, H-sy-8, c[1]); for(var y=sy+16;y<H;y+=12) P(cx, y, IVORY[3]);
    R(cx+8, sy+20, 18, 14, c[1]); R(cx+8, sy+20, 18, 3, c[3]);
  }
  function abaya(sp, cx, sy, hw){
    var r = sp.robe;
    shadeBody(cx, sy, hw-2, r);
    for(var k=0;k<4;k++){ var fx = cx-hw+14+k*20; line(fx, sy+30, fx-3, H, 1, r[0]); line(fx+1, sy+30, fx-2, H, 1, r[3]); }
    var e = sp.embroid;
    for(var y=sy-2; y<H; y++){
      var m = (y-sy)%8;
      R(cx-3, y, 6, 1, r[1]);
      if(m===0||m===4){ P(cx, y, e[1]); } else if(m===2){ P(cx-2,y,e[0]); P(cx+2,y,e[0]); P(cx,y,e[1]); } else if(m===1||m===3){ P(cx-1,y,e[0]); P(cx+1,y,e[0]); }
    }
  }
  function hivis(sp, cx, sy, hw){
    thobe(sp, cx, sy, hw);
    var o = ['#A9600C','#D07F14','#EE9E22','#F8BE4C'];
    var L = [[cx-12,sy-3],[cx-hw+20,sy+1],[cx-hw+16,sy+16],[cx-hw+14,H+2],[cx-8,H+2],[cx-8,sy+14]];
    var Rr= [[cx+12,sy-3],[cx+hw-20,sy+1],[cx+hw-16,sy+16],[cx+hw-14,H+2],[cx+8,H+2],[cx+8,sy+14]];
    poly(L, o[2]); poly(Rr, o[1]); dith(cx-hw+18, sy+6, 6, 40, o[3]);
    [sy+34, sy+58].forEach(function(y){
      R(cx-hw+15, y, hw-23, 5, '#B7C0C4'); R(cx-hw+15, y+1, hw-23, 2, '#EEF3F5'); R(cx+8, y, hw-23, 5, '#A6AFB3'); R(cx+8, y+1, hw-23, 2, '#DDE4E7');
    });
    line(cx-hw+13, sy+16, cx-hw+13, H, 1, o[0]); line(cx+hw-14, sy+16, cx+hw-14, H, 1, o[0]);
    line(cx-8, sy+14, cx-8, H, 1, o[0]); line(cx+8, sy+14, cx+8, H, 1, o[0]);
  }
  function badge(cx, sy){
    line(cx-9, sy-2, cx-5, sy+36, 1, EM[4]); line(cx+9, sy-2, cx+3, sy+36, 1, EM[4]);
    R(cx-6, sy+36, 10, 13, IVORY[4]); R(cx-6, sy+36, 10, 4, EM[5]); R(cx-4, sy+42, 6, 1, IVORY[1]); R(cx-4, sy+45, 4, 1, IVORY[1]); R(cx-6,sy+48,10,1,IVORY[0]);
  }

  /* ---------- head: cartoon proportions (head scaled by K) and large expressive eyes ---------- */
  var K = 1.32;
  function s(n){ return Math.round(n*K); }
  function faceInset(shape, r){
    var b = r / K, start = shape==='round'?17:shape==='square'?25:shape==='long'?24:21, len = 36-start, inset = 0;
    if(b>start){ var t=Math.min(1,(b-start)/len); inset = shape==='square' ? t*t*7 : shape==='round' ? t*t*11 : t*t*9; }
    if(b<3) inset = Math.max(inset, [3,1,0][Math.max(0,Math.floor(b))]);
    return Math.round(inset*K);
  }
  var LID = '#1C110B', WHITE = '#F4F0E8', IRIS = '#2B1A10';
  function face(sp, cx, fy, st){
    var fw = sp.fw, fx = cx - fw/2, sk = SKIN[sp.skin], shape = sp.face, rows = s(36), veiled = sp.head==='niqab';
    var e = EXPR[st.expr] || EXPR.normal;
    spans(fy, fy+rows, function(y){ var n=faceInset(shape, y-fy); return [fx+n, fx+fw-n]; }, sk[1]);
    spans(fy, fy+rows, function(y){ var n=faceInset(shape, y-fy); return [fx+fw-n-7, fx+fw-n]; }, sk[2]);
    spans(fy, fy+rows, function(y){ var n=faceInset(shape, y-fy); return [fx+fw-n-2, fx+fw-n]; }, sk[3]);
    for(var y=fy; y<fy+rows; y++){ var n0=faceInset(shape, y-fy); if(y&1) P(fx+fw-n0-8, y, sk[2]); }
    dith(fx+5, fy+s(17), 7, 7, sk[0]); R(fx+6, fy+6, fw-14, 1, sk[0]);
    if(sp.head!=='hair') R(fx+2, fy, fw-4, 4, sk[2]);
    var ey = fy+s(14), my = fy+s(28), exL = cx-s(8), exR = cx+s(7);
    if(!veiled){
      if(sp.age>=2){ line(cx-s(6), ey+s(7), cx-s(8), my, 1, sk[2]); line(cx+s(5), ey+s(7), cx+s(7), my, 1, sk[3]); }
      if(sp.age>=4){ R(cx-s(5), fy+5, s(10), 1, sk[2]); }
      var nl = s(sp.nose==='long' ? 9 : sp.nose==='small' ? 6 : 8), nw = sp.nose==='wide' ? 4 : 3;
      for(var k=2;k<nl;k++) if(k>3||(k&1)) P(cx+1, ey+k, sk[2]);
      P(cx+2, ey+nl-2, sk[3]); P(cx, ey+nl-2, sk[0]); P(cx-1, ey+nl-1, sk[0]);
      P(cx-nw+1, ey+nl, sk[3]); P(cx+nw, ey+nl, sk[4]); R(cx-nw+2, ey+nl+1, nw*2-2, 1, sk[2]);
      if(e.fx==='blush'){ dith(fx+4, ey+s(6), 7, 4, '#E58C7A'); dith(fx+fw-11, ey+s(6), 7, 4, '#C9705E'); }
      beard(sp, cx, fx, fw, fy, ey, my, shape, st);
      mouth(sp, cx, my, st.mouth && e.mouth!=='shout' && e.mouth!=='teeth' ? 'open' : e.mouth, sk);
      moustache(sp, cx, my);
    }
    eyes(sp, exL, exR, ey, st, e, sk);
  }
  function eyes(sp, exL, exR, ey, st, e, sk){
    var lk = e.look||0, lky = e.lookY||0, kind = st.blink && e.eyes!=='happy' ? 'blink' : e.eyes;
    if(sp.eyes==='hooded' && kind==='n') kind = 'hooded';
    [[exL,-1],[exR,1]].forEach(function(p){
      var x = p[0], side = p[1];
      if(sp.eyes==='deep') R(x-4, ey-3, 9, 1, sk[3]);
      if(kind==='blink'){ R(x-3, ey+1, 7, 1, LID); P(x+3*side, ey, LID); return; }
      if(kind==='happy'){ R(x-2, ey-1, 5, 2, LID); P(x-3, ey+1, LID); P(x+3, ey+1, LID); return; }
      if(kind==='wide'){ R(x-3, ey-3, 7, 1, LID); R(x-3, ey-2, 7, 6, WHITE); R(x-1+lk, ey, 2, 2, IRIS); P(x-1+lk, ey, '#fff'); R(x-3, ey+4, 7, 1, sk[2]); return; }
      if(kind==='narrow'){ R(x-3, ey, 7, 1, LID); R(x-3, ey+1, 7, 2, WHITE); R(x-1+lk, ey+1, 3, 2, IRIS); P(x-1+lk, ey+1, '#6A4A36'); return; }
      if(kind==='hooded'){ R(x-3, ey-1, 7, 2, LID); R(x-3, ey+1, 7, 2, WHITE); R(x-1+lk, ey+1, 3, 2, IRIS); R(x-2, ey+3, 5, 1, sk[2]); return; }
      R(x-3, ey-2, 7, 1, LID); R(x-3, ey-1, 7, 4, WHITE);
      R(x-1+lk, ey-1+lky, 3, 4, IRIS); P(x-1+lk, ey-1+lky, '#FFFFFF'); P(x+1+lk, ey+1+lky, '#5A3A26');
      R(x-2, ey+3, 5, 1, sk[2]);
      if(sp.eyes==='lash'){ R(x-3, ey-3, 7, 1, LID); P(x+4*side, ey-3, LID); P(x+4*side, ey-2, LID); P(x+3*side, ey-4, LID); }
      if(sp.eyes==='keen'){ P(x+4*side, ey-2, LID); }
    });
    brows(sp, exL, exR, ey-s(5), e.brow);
    glasses(sp, exL, exR, ey, e);
  }
  function brows(sp, exL, exR, by, kind){
    var th = (sp.brow||2)+1, c = sp.browC;
    [[exL,-1],[exR,1]].forEach(function(p){
      var x = p[0], side = p[1];
      for(var i=0;i<8;i++){
        var px = x + side*(4 - i), inner = i/7, outer = 1-inner, dy = 0;
        if(kind==='angry') dy = Math.round(-1*outer + 3*inner);
        else if(kind==='worried') dy = Math.round(1*outer - 3*inner);
        else if(kind==='raised') dy = -3;
        else if(kind==='stern') dy = Math.round(inner*2);
        else if(kind==='soft') dy = -1;
        else if(kind==='smug') dy = side>0 ? -3+Math.round(inner) : Math.round(inner);
        else if(kind==='think') dy = side>0 ? -3 : 1;
        else dy = i===0 ? 1 : 0;
        R(px, by+dy, 1, Math.max(1, th - (i===0||i===7 ? 1 : 0)), c);
      }
    });
  }
  function glasses(sp, exL, exR, ey, e){
    if(!sp.glasses) return;
    var f = '#15110E', glint = e.fx==='glint';
    [exL, exR].forEach(function(x, n){
      if(sp.glasses==='rect' || sp.glasses==='square'){
        var hh = sp.glasses==='square' ? 8 : 7;
        R(x-5, ey-3, 11, 1, f); R(x-5, ey-4+hh, 11, 1, f); R(x-5, ey-3, 1, hh, f); R(x+5, ey-3, 1, hh, f);
        if(glint) R(x-4, ey-2, 9, hh-2, '#DDEDEA'); else { P(x-4+n, ey-2, '#E9F3F1'); P(x-3+n, ey-2, 'rgba(233,243,241,.5)'); }
      } else if(sp.glasses==='round'){
        R(x-3, ey-3, 7, 1, f); R(x-3, ey+4, 7, 1, f); R(x-4, ey-2, 1, 6, f); R(x+4, ey-2, 1, 6, f);
        if(glint) R(x-3, ey-2, 7, 6, '#DDEDEA'); else P(x-3, ey-2, '#E9F3F1');
      } else if(sp.glasses==='half'){
        R(x-5, ey+4, 11, 1, '#2B2622'); R(x-5, ey+1, 1, 3, '#2B2622'); R(x+5, ey+1, 1, 3, '#2B2622'); R(x-4, ey+1, 9, 1, 'rgba(232,240,236,.35)');
        if(glint) R(x-4, ey+1, 9, 3, '#DDEDEA');
      }
    });
    var by = sp.glasses==='half' ? ey+2 : ey-1;
    R(exL+6, by, exR-exL-11, 1, f); R(exL-7, by, 2, 1, f); R(exR+6, by, 2, 1, f);
  }
  function beard(sp, cx, fx, fw, fy, ey, my, shape, st){
    var b = sp.beardC; if(!b || sp.beard==='none' || sp.beard==='moustache') return;
    var chin = fy+s(36);
    if(sp.beard==='stubble'){
      for(var y=ey+s(8); y<chin; y++){ var n=faceInset(shape, y-fy); for(var x=fx+n+1; x<fx+fw-n-1; x++){ var inMouth = Math.abs(x-cx)<7 && Math.abs(y-my)<3; if(!inMouth && hash(x,y)<0.32 && (y>my-3 || x<fx+n+7 || x>fx+fw-n-8)) P(x,y,b[1]); } }
      return;
    }
    if(sp.beard==='goatee'){
      spans(my+2, chin+3, function(y){ var w = y<chin-2 ? 7 : 5; return [cx-w, cx+w]; }, b[0]);
      R(cx-7, my-1, 2, 5, b[0]); R(cx+5, my-1, 2, 5, b[0]); dith(cx-4, my+4, 4, 4, b[2]);
      return;
    }
    var side = sp.beard==='trim' || sp.beard==='short' ? 4 : 6;
    var top = sp.beard==='full' ? ey+s(7) : ey+s(9);
    for(var y2=top; y2<chin+4; y2++){
      var n2 = faceInset(shape, Math.min(s(36)-1, y2-fy)), x0 = fx+n2, x1 = fx+fw-n2;
      if(y2>=chin){ var k=y2-chin+1; x0 = cx-(fw/2-10)+k*3; x1 = cx+(fw/2-10)-k*3; if(x1<=x0) continue; }
      if(y2 < my-3){ R(x0, y2, side, 1, b[1]); R(x1-side, y2, side, 1, b[0]); continue; }
      R(x0, y2, x1-x0, 1, b[1]); R(x1-6, y2, 6, 1, b[0]);
    }
    for(var y3=my+2; y3<chin+2; y3+=3) for(var x3=fx+5; x3<fx+fw-9; x3+=5) if(hash(x3,y3)<0.25) P(x3, y3, b[2]);
    spans(top, my-3, function(y){ var n4=faceInset(shape,y-fy); return [fx+n4+side, fx+n4+side+1]; }, b[2]);
    R(cx-6, my+3, 12, 1, b[2]);
  }
  function mouth(sp, cx, my, kind, sk){
    var lip = sp.beard && sp.beard!=='none' && sp.beard!=='stubble' && sp.beard!=='moustache' ? '#3A1F18' : '#7A3A2E', dark = '#2A0F0B', teeth = '#EFE8DC';
    if(kind==='open'){ R(cx-4, my-1, 9, 5, dark); R(cx-3, my-1, 7, 1, teeth); R(cx-2, my+2, 5, 2, '#9C3A32'); R(cx-3, my+4, 7, 1, sk[3]); return; }
    if(kind==='shout'){ R(cx-5, my-3, 11, 8, dark); R(cx-4, my-3, 9, 2, teeth); R(cx-3, my+2, 7, 3, '#9C3A32'); R(cx-4, my+5, 9, 1, sk[3]); return; }
    if(kind==='teeth'){ R(cx-6, my-2, 13, 5, dark); R(cx-5, my-1, 11, 3, teeth); R(cx-1, my-1, 1, 3, '#BDB4A5'); R(cx+2, my-1, 1, 3, '#BDB4A5'); return; }
    if(kind==='smile'){ R(cx-5, my, 11, 2, lip); P(cx-6, my-1, lip); P(cx+6, my-1, lip); R(cx-3, my+1, 7, 1, '#9C3A32'); R(cx-4, my+2, 9, 1, sk[0]); return; }
    if(kind==='smug'){ R(cx-4, my, 9, 1, lip); P(cx+5, my-1, lip); P(cx+6, my-2, lip); R(cx-2, my+1, 6, 1, sk[0]); return; }
    if(kind==='frown'){ R(cx-4, my, 9, 1, lip); P(cx-5, my+1, lip); P(cx+5, my+1, lip); return; }
    if(kind==='wavy'){ for(var i=-5;i<=5;i++) P(cx+i, my+(((i+6)>>1)&1), lip); return; }
    if(kind==='side'){ R(cx-1, my, 6, 1, lip); P(cx+5, my-1, lip); return; }
    if(kind==='flat'){ R(cx-5, my, 11, 1, lip); return; }
    R(cx-4, my, 9, 1, lip); R(cx-3, my+1, 7, 1, sk[0]);
  }
  function moustache(sp, cx, my){
    var b = sp.beardC; if(!b || sp.beard==='none' || sp.beard==='stubble') return;
    var thick = sp.beard==='moustache' ? 4 : 3, w = sp.beard==='moustache' ? 9 : 8;
    R(cx-w, my-2-thick+1, w*2, thick, b[1]); R(cx, my-2-thick+1, w, thick, b[0]);
    P(cx-w-1, my-1, b[1]); P(cx+w, my-1, b[0]); P(cx-2, my-2-thick+1, b[2]); P(cx-5, my-2-thick+1, b[2]);
  }
  function hair(sp, cx, fy){
    var h = sp.hairC, fw = sp.fw, fx = cx-fw/2, sk = SKIN[sp.skin];
    R(fx-3, fy+s(12), 4, s(9), sk[2]); R(fx+fw-1, fy+s(12), 4, s(9), sk[3]); P(fx-2, fy+s(14), sk[3]);
    var hc = fy+s(4), hr = s(18);
    spans(fy-s(15), fy+s(7), function(y){ var d=(y-hc)/hr; if(d*d>1) return null; var w=(fw/2+3)*Math.sqrt(1-d*d); return [cx-w, cx+w]; }, h[1]);
    R(fx, fy+s(4), fw, 4, h[1]); R(fx-1, fy+s(6), 4, s(8), h[1]); R(fx+fw-3, fy+s(6), 4, s(8), h[0]);
    spans(fy-s(15), fy+s(7), function(y){ var d=(y-hc)/hr; if(d*d>1) return null; var w=(fw/2+3)*Math.sqrt(1-d*d); return [cx+w*0.3, cx+w]; }, h[0]);
    for(var y=fy-s(13); y<fy+s(5); y+=2) for(var x=fx; x<fx+fw; x+=sp.curly?2:3) if(hash(x,y)<(sp.curly?0.5:0.3)) P(x, y, h[2]);
    if(sp.curly){ for(var x2=fx+1; x2<fx+fw-1; x2+=3) P(x2, fy+s(7), h[1]); }
  }
  function cloth(sp){ return sp.head==='shemagh' ? 'red' : 'white'; }
  function clothFn(kind, fold){
    return function(x,y){
      if(kind==='red'){
        var on = (((x>>1)+(y>>1))&1)===0, f = fold(x,y);
        if(on) return f>1 ? SHEMAGH_RED[0] : f>0 ? SHEMAGH_RED[1] : SHEMAGH_RED[2];
        return f>1 ? GHUTRA[0] : f>0 ? GHUTRA[1] : GHUTRA[3];
      }
      var f2 = fold(x,y); return f2>1 ? GHUTRA[0] : f2>0 ? GHUTRA[1] : (hash(x,y)<0.06 ? GHUTRA[4] : GHUTRA[2]);
    };
  }
  function headCap(sp, cx, top, fy){
    var fw = sp.fw, rx = fw/2+s(6), kind = cloth(sp), cy = fy+3;
    var pts = []; for(var a=0;a<=24;a++){ var t=Math.PI*(1+a/24); pts.push([cx+Math.cos(t)*rx, cy+Math.sin(t)*(cy-top)]); }
    pts.push([cx+rx, cy+2]); pts.push([cx-rx, cy+2]);
    polyF(pts, clothFn(kind, function(x,y){ return x>cx+rx-6 ? 2 : (x>cx+rx*0.35 ? 1 : 0); }));
    if(sp.peak){ var pk = s(5); poly([[cx-pk-2,top+4],[cx,top-pk],[cx+pk+2,top+4]], kind==='red'?SHEMAGH_RED[2]:GHUTRA[3]); line(cx, top-pk+1, cx, top+6, 1, kind==='red'?SHEMAGH_RED[0]:GHUTRA[0]); }
    R(cx-rx+2, fy-2, rx*2-4, 4, kind==='red'?GHUTRA[2]:GHUTRA[3]); R(cx-rx+2, fy+2, rx*2-4, 1, GHUTRA[0]);
    if(sp.agal){
      [top+s(9), top+s(13)].forEach(function(y){
        var d=(y-cy)/(cy-top), w = rx*Math.sqrt(Math.max(0,1-d*d))+1;
        R(cx-w, y, w*2, 3, '#0E0C0B'); R(cx-w+3, y, w*0.9, 1, '#4A4540'); P(cx-w, y+2, '#000'); P(cx+w-1, y+2, '#000');
      });
    }
  }
  /* Side panels of the shemagh. With a bisht they rest on the shoulders and are drawn BEFORE the bisht,
     so the bisht's collar and gold-trimmed front edges lie on top of them. */
  function headHang(sp, cx, fy, sy, under){
    var fw = sp.fw, fx = cx-fw/2, kind = cloth(sp), c30 = fy+s(30);
    var foldFn = function(x,y){ var r=(x*3+y)%9; return r===0 ? 2 : r<3 ? 1 : 0; };
    var bottom = under ? sy+16 : sy+44, outer = under ? 18 : 16;
    polyF([[fx-7,fy+1],[fx+1,fy+3],[fx+1,c30],[cx-12,sy-4],[cx-15,bottom],[fx-outer,bottom+4],[fx-13,sy+4],[fx-9,c30]], clothFn(kind, foldFn));
    polyF([[fx+fw+7,fy+1],[fx+fw-1,fy+3],[fx+fw-1,c30],[cx+12,sy-4],[cx+15,bottom],[fx+fw+outer,bottom+4],[fx+fw+13,sy+4],[fx+fw+9,c30]], clothFn(kind, function(x,y){ return foldFn(x,y)+1; }));
    if(sp.pleats){
      /* royal pleats: crisp stacked creases on the right panel */
      for(var k=0;k<5;k++){ var yy = fy+s(8)+k*s(5); line(fx+fw, yy, fx+fw+5, yy+3, 1, SHEMAGH_RED[0]); line(fx+fw, yy+1, fx+fw+5, yy+4, 1, GHUTRA[4]); }
    }
    if(!under && kind==='red'){ for(var x=fx-15; x<cx-14; x+=2) R(x, bottom+4, 1, 2+((x>>1)&1), SHEMAGH_RED[1]); for(var x2=cx+14; x2<fx+fw+16; x2+=2) R(x2, bottom+4, 1, 2+((x2>>1)&1), SHEMAGH_RED[1]); }
  }
  function wrap(sp, cx, top, fy){
    var fw = sp.fw, rx = fw/2+s(5), cy = fy+2;
    var pts=[]; for(var a=0;a<=16;a++){ var t=Math.PI*(1+a/16); pts.push([cx+Math.cos(t)*rx, cy+Math.sin(t)*(cy-top-4)]); }
    polyF(pts, clothFn('red', function(x,y){ return ((x+y*2)%7===0) ? 2 : x>cx+rx*0.4 ? 1 : 0; }));
    for(var k=0;k<3;k++){ var yy = fy-3-k*s(5); var d=(yy-cy)/(cy-top-4), w=rx*Math.sqrt(Math.max(0,1-d*d))-1; line(cx-w, yy+2, cx+w, yy-2, 1, SHEMAGH_RED[0]); }
    R(cx-rx+1, fy-1, rx*2-2, 2, SHEMAGH_RED[1]);
    polyF([[cx+rx-3,fy-6],[cx+rx+6,fy-2],[cx+rx+8,fy+s(14)],[cx+rx+2,fy+s(18)],[cx+rx-1,fy+2]], clothFn('red', function(){ return 1; }));
  }
  /* Black head cover and niqab: only the eye band (brows + eyes) stays visible. */
  function veil(sp, cx, top, fy, sy, layer){
    var hj = sp.veil, fw = sp.fw, rx = fw/2+s(8), ey = fy+s(14), chin = fy+s(36);
    if(layer==='back'){
      ell(cx, fy+s(14), rx, fy+s(14)-top+2, hj[2]);
      poly([[cx-rx+1,fy+s(22)],[cx+rx-1,fy+s(22)],[cx+rx+14,sy+24],[cx-rx-14,sy+24]], hj[2]);
      poly([[cx+4,fy+s(22)],[cx+rx-1,fy+s(22)],[cx+rx+14,sy+24],[cx+6,sy+24]], hj[1]);
      spans(top-1, fy+s(12), function(y){ var d=(y-(fy+s(14)))/(fy+s(14)-top+2); if(d*d>1) return null; var w=rx*Math.sqrt(1-d*d); return [cx+w*0.35, cx+w]; }, hj[1]);
      dith(cx-rx+4, top+6, 9, s(12), hj[3]);
      return;
    }
    var bandTop = ey-s(5)-3, bandBot = ey+s(4)+1;
    /* forehead cover */
    spans(fy-3, bandTop, function(){ return [cx-fw/2-3, cx+fw/2+3]; }, hj[2]);
    R(cx-fw/2-3, bandTop-1, fw+6, 1, hj[3]);
    /* frame at the sides of the eye band */
    R(cx-fw/2-3, bandTop, 5, bandBot-bandTop, hj[2]); R(cx+fw/2-2, bandTop, 5, bandBot-bandTop, hj[1]);
    /* niqab */
    poly([[cx-fw/2-3,bandBot],[cx+fw/2+3,bandBot],[cx+fw/2+8,sy+16],[cx-fw/2-8,sy+16]], hj[2]);
    poly([[cx+2,bandBot],[cx+fw/2+3,bandBot],[cx+fw/2+8,sy+16],[cx+4,sy+16]], hj[1]);
    R(cx-fw/2-3, bandBot, fw+6, 1, hj[4]);
    for(var k=0;k<3;k++) line(cx-fw/2+4+k*s(7), bandBot+6, cx-fw/2+2+k*s(7), sy+14, 1, hj[3]);
    if(sp.embroid){ R(cx-fw/2-3, bandBot+1, fw+6, 1, sp.embroid[0]); for(var x=cx-fw/2; x<cx+fw/2; x+=4) P(x, bandBot+1, sp.embroid[1]); }
  }

  /* ---------- arms and hands (poses) ---------- */
  function sleeveCol(sp){
    if(sp.outfit==='bisht'||sp.outfit==='abaya') return [sp.robe[1], sp.robe[2], sp.robe[3]];
    if(sp.outfit==='coverall') return [sp.cov[1], sp.cov[2], sp.cov[3]];
    if(sp.outfit==='shirt') return [sp.shirt[1], sp.shirt[2], sp.shirt[3]];
    var t = sp.thobe||THOBE; return [t[1], t[2], t[3]];
  }
  function hand(sp, x, y, kind, dir){
    var sk = SKIN[sp.skin];
    if(kind==='point'){
      R(x-4, y-4, 9, 8, sk[1]); R(x-4, y+2, 9, 2, sk[2]); R(x-4, y-4, 9, 1, sk[0]);
      R(dir>0 ? x+5 : x-12, y-3, 8, 3, sk[1]); R(dir>0 ? x+5 : x-12, y-1, 8, 1, sk[2]);
      P(dir>0 ? x+12 : x-12, y-3, sk[0]); R(x-3, y-1, 7, 1, sk[3]);
      if(sp.ring){ R(dir>0?x+5:x-6, y-1, 2, 3, GOLD[4]); }
      return;
    }
    if(kind==='flat'){ R(x-7, y-3, 14, 5, sk[1]); R(x-7, y+1, 14, 1, sk[3]); for(var i=-5;i<6;i+=3) P(x+i, y-2, sk[2]); return; }
    if(kind==='chin'){ R(x-5, y-3, 11, 7, sk[1]); R(x-5, y+3, 11, 1, sk[3]); P(x-3,y-1,sk[2]); P(x,y-1,sk[2]); P(x+3,y-1,sk[2]); R(x+4,y-3,2,5,sk[2]); return; }
    R(x-4, y-3, 8, 7, sk[1]); R(x-4, y+3, 8, 1, sk[3]); R(x-4, y-3, 8, 1, sk[0]);
  }
  function sleeve(sp, x0, y0, x1, y1, w){
    var c = sleeveCol(sp);
    line(x0, y0, x1, y1, w, c[1]);
    line(x0, y0+w/2-2, x1, y1+w/2-2, 3, c[0]);
    line(x0, y0-w/2+2, x1, y1-w/2+2, 2, c[2]);
    if(sp.outfit==='bisht' && sp.trim && sp.trim!=='none'){ var dx=x1-x0, dy=y1-y0, L=Math.sqrt(dx*dx+dy*dy)||1, nx=-dy/L, ny=dx/L; line(x1-nx*w/2, y1-ny*w/2, x1+nx*w/2, y1+ny*w/2, 3, GOLD[3]); }
    if(sp.outfit==='coverall'){ var mx=(x0+x1)/2, my=(y0+y1)/2; line(mx-2,my-w/2,mx-2,my+w/2,3,'#C6D0D4'); }
  }
  function arms(sp, cx, sy, hw, st, X){
    var pose = st.pose, d = st.dir||1, w = sp.outfit==='bisht'||sp.outfit==='abaya' ? 19 : 12;
    if(pose==='point'){
      var sxp = cx + d*(hw-8), sy0 = sy+16;
      sleeve(sp, sxp, sy0, cx+d*(hw+18), sy+32, w);
      sleeve(sp, cx+d*(hw+18), sy+32, cx+d*(hw+52), sy+16, w-3);
      hand(sp, cx+d*(hw+58), sy+15, 'point', d);
    } else if(pose==='think'){
      sleeve(sp, cx+hw-10, sy+12, cx+hw-8, sy+58, w);
      sleeve(sp, cx+hw-8, sy+58, cx+12, X.chin+8, w-3);
      hand(sp, cx+8, X.chin+2, 'chin', 1);
    } else if(pose==='crossed'){
      var yA = sy+46;
      sleeve(sp, cx-hw+2, yA-12, cx+hw-14, yA+4, w);
      sleeve(sp, cx+hw-2, yA-10, cx-hw+16, yA+8, w);
      hand(sp, cx+hw-12, yA-2, 'fist'); hand(sp, cx-hw+14, yA+6, 'fist');
    } else if(pose==='slam' || pose==='clasp' || pose==='write'){
      var dy = X.deskY || 200;
      if(pose==='clasp'){ sleeve(sp, cx-hw+4, sy+30, cx-10, dy-6, w); sleeve(sp, cx+hw-4, sy+30, cx+10, dy-6, w); R(cx-12, dy-10, 24, 8, SKIN[sp.skin][1]); R(cx-12, dy-3, 24, 1, SKIN[sp.skin][3]); for(var k=-9;k<10;k+=3) P(cx+k, dy-8, SKIN[sp.skin][2]); }
      else if(pose==='write'){ sleeve(sp, cx+hw-4, sy+30, cx+22, dy-4, w); hand(sp, cx+20, dy-5, 'fist'); line(cx+16, dy-4, cx+8, dy+2, 1, '#E8E2D4'); P(cx+8,dy+2,GOLD[4]); sleeve(sp, cx-hw+4, sy+30, cx-26, dy-4, w); hand(sp, cx-26, dy-4, 'flat'); }
      else { sleeve(sp, cx-hw+2, sy+26, cx-hw-10, dy-4, w); sleeve(sp, cx+hw-2, sy+26, cx+hw+10, dy-4, w); hand(sp, cx-hw-12, dy-3, 'flat'); hand(sp, cx+hw+12, dy-3, 'flat'); }
    } else if(pose==='present'){
      sleeve(sp, cx+d*(hw-8), sy+18, cx+d*(hw+12), sy+2, w);
      var px = cx+d*(hw+12) - 13, py = sy-34;
      R(px, py, 26, 34, IVORY[4]); R(px, py, 26, 1, IVORY[5]); R(px+25, py, 1, 34, IVORY[1]); R(px, py+33, 26, 1, IVORY[0]);
      R(px+3, py+3, 20, 3, EM[4]); for(var ln=0;ln<6;ln++) R(px+4, py+10+ln*3, ln===5?10:18, 1, IVORY[1]);
      ell(px+19, py+27, 3, 3, '#9C2B22'); P(px+18, py+26, '#C9473A');
      hand(sp, cx+d*(hw+12), sy+2, 'fist');
    } else if(pose==='gavel'){
      var t = X.gavelT, down = t>=0 && t<0.32;
      var hx = cx-hw-26, hy = down ? sy+36 : sy-14;
      sleeve(sp, cx-hw+6, sy+18, hx+6, hy+6, w);
      hand(sp, hx, hy, 'fist');
      var gx = hx-4, gy = hy;
      if(down){ line(gx, gy, gx-26, gy+6, 3, WOOD[4]); R(gx-34, gy-2, 12, 16, WOOD[3]); R(gx-34, gy-2, 12, 3, WOOD[5]); R(gx-34, gy+3, 12, 2, GOLD[3]); R(gx-34, gy+9, 12, 2, GOLD[3]); }
      else { line(gx, gy, gx-6, gy-26, 3, WOOD[4]); R(gx-14, gy-36, 16, 12, WOOD[3]); R(gx-14, gy-36, 16, 3, WOOD[5]); R(gx-10, gy-36, 2, 12, GOLD[3]); R(gx-4, gy-36, 2, 12, GOLD[3]); }
    } else if(sp.hold==='folder'){
      var fy0 = sy+30;
      sleeve(sp, cx-hw+4, sy+20, cx-14, fy0+18, w); sleeve(sp, cx+hw-4, sy+20, cx+12, fy0+22, w);
      R(cx-22, fy0, 40, 30, EM[3]); R(cx-22, fy0, 40, 2, EM[5]); R(cx-22, fy0+29, 40, 1, EM[1]); R(cx-4, fy0+10, 8, 8, GOLD[3]); R(cx-3, fy0+11, 6, 6, GOLD[4]);
      hand(sp, cx-14, fy0+20, 'fist'); hand(sp, cx+12, fy0+24, 'fist');
    }
    if(sp.misbaha && !pose){ var mx = cx-hw+6, my = sy+70; for(var b=0;b<9;b++){ var a=b/8*Math.PI; P(mx+Math.cos(a)*6, my+Math.sin(a)*10, b%3?'#7A2B1E':GOLD[4]); } }
  }

  /* ---------- full character ---------- */
  function person(id, cx, top, st, X){
    var base = CAST[id]; if(!base) return;
    X = X || {};
    var sp = Object.create(base); sp.fw = Math.round(base.fw*K);
    var stoop = sp.stoop||0, br = st.breath ? 1 : 0;
    var fy = top + s(16), chin = fy + s(36), sy = chin + 9 + stoop + br, hw = BUILD[sp.build]/2, sk = SKIN[sp.skin];
    var expr = st.expr==='normal' && DEFAULT_EXPR[id] ? DEFAULT_EXPR[id] : st.expr;
    var ss = {expr:expr, pose:st.pose, dir:st.dir, mouth:st.mouth, blink:st.blink};
    var e = EXPR[expr] || EXPR.normal;
    if(e.fx==='dots' && !ss.pose) ss.pose = 'think';
    X.chin = chin;
    var cloak = sp.outfit==='bisht', scarf = sp.head==='shemagh'||sp.head==='ghutra';
    if(sp.head==='niqab') veil(sp, cx, top, fy, sy, 'back');
    /* body */
    if(sp.outfit==='coverall') coverall(sp, cx, sy, hw);
    else if(sp.outfit==='shirt') shirt(sp, cx, sy, hw);
    else if(sp.outfit==='abaya') abaya(sp, cx, sy, hw);
    else if(sp.outfit==='hivis') hivis(sp, cx, sy, hw);
    else thobe(sp, cx, sy, hw);
    /* neck */
    R(cx-s(5), chin-6, s(10), sy-chin+6, sk[2]); R(cx+2, chin-6, s(4), sy-chin+6, sk[3]);
    if(sp.outfit==='thobe'||cloak||sp.outfit==='vest'||sp.outfit==='hivis') collar(sp, cx, sy);
    /* shemagh first, bisht on top */
    if(cloak && scarf) headHang(sp, cx, fy, sy, true);
    if(cloak) bisht(sp, cx, sy, hw);
    if(sp.outfit==='vest') vest(sp, cx, sy, hw);
    if(sp.badge) badge(cx, sy);
    if(sp.pen && !cloak){ R(cx-hw+18, sy+18, 2, 10, GOLD[4]); }
    /* head */
    face(sp, cx, fy, ss);
    if(sp.head==='hair') hair(sp, cx, fy);
    if(scarf){ if(!cloak) headHang(sp, cx, fy, sy, false); headCap(sp, cx, top, fy); }
    if(sp.head==='wrap') wrap(sp, cx, top, fy);
    if(sp.head==='niqab'){ veil(sp, cx, top, fy, sy, 'front'); eyes(sp, cx-s(8), cx+s(7), fy+s(14), ss, e, sk); }
    arms(sp, cx, sy, hw, ss, X);
    fx(sp, cx, fy, e);
  }
  function fx(sp, cx, fy, e){
    var fw = Math.round(sp.fw*K);
    if(e.fx==='sweat'){ [[cx+fw/2+3, fy+8],[cx+fw/2+6, fy+18],[cx-fw/2-4, fy+12]].forEach(function(p){ R(p[0], p[1], 2, 3, '#CDEBFA'); P(p[0], p[1]-1, '#CDEBFA'); R(p[0], p[1]+3, 2, 1, '#6FA9C9'); P(p[0]+1, p[1]+1, '#FFFFFF'); }); }
    if(e.fx==='vein'){ var vx = cx+fw/2-2, vy = fy-6; R(vx, vy, 5, 1, '#E0533F'); R(vx+2, vy-2, 1, 5, '#E0533F'); P(vx+1,vy-1,'#E0533F'); P(vx+3,vy+1,'#E0533F'); }
    if(e.fx==='dots'){ [0,1,2].forEach(function(k){ R(cx+fw/2+10+k*7, fy-10-k*4, 3+k, 3+k, IVORY[4]); }); }
  }

  /* ---------- outline and rim light: makes figures read clearly against busy rooms ---------- */
  function finish(c){
    var k = c.getContext('2d'), im = k.getImageData(0,0,c.width,c.height), d = im.data, w = c.width, h = c.height, out = new Uint8ClampedArray(d);
    function a(x,y){ return x<0||y<0||x>=w||y>=h ? 0 : d[(y*w+x)*4+3]; }
    for(var y=0;y<h;y++) for(var x=0;x<w;x++){
      var i=(y*w+x)*4;
      if(d[i+3]===0){
        if(a(x-1,y)||a(x+1,y)||a(x,y-1)||a(x,y+1)){ out[i]=11; out[i+1]=8; out[i+2]=7; out[i+3]=235; }
      } else if(!a(x-1,y) || !a(x,y-1)){
        out[i]=Math.min(255,d[i]*0.72+236*0.28); out[i+1]=Math.min(255,d[i+1]*0.72+214*0.28); out[i+2]=Math.min(255,d[i+2]*0.72+160*0.28);
      } else if(!a(x+1,y)){
        out[i]=d[i]*0.8; out[i+1]=d[i+1]*0.8; out[i+2]=d[i+2]*0.8;
      }
    }
    im.data.set(out); k.putImageData(im,0,0);
  }

  /* ---------- character cache (each state is rendered once) ---------- */
  var cache = {}, cacheKeys = [];
  function cachedPerson(id, cx, top, st, X){
    var key = [id, st.expr, st.pose||'', st.dir||1, st.mouth?1:0, st.blink?1:0, st.breath?1:0, X && X.deskY||0, X && X.gavelT>=0 ? (X.gavelT<0.32?'d':'u') : ''].join('|');
    var c = cache[key];
    if(!c){
      c = document.createElement('canvas'); c.width = W; c.height = H;
      var keep = g; g = c.getContext('2d'); g.imageSmoothingEnabled = false;
      person(id, 240, top, st, X);
      g = keep; finish(c); cache[key] = c; cacheKeys.push(key);
      if(cacheKeys.length > 56){ delete cache[cacheKeys.shift()]; }
    }
    g.drawImage(c, cx-240, 0);
  }


  /* ---------- character sprites from the approved concept sheet (court/cast.webp) ----------
     Code-drawn characters above stay as the fallback until the image has loaded. */
  var SRC = (document.currentScript && document.currentScript.src) || '';
  var BASE = SRC.split('?')[0].replace(/[^\/]*$/, ''), VQ = SRC.indexOf('?') >= 0 ? SRC.slice(SRC.indexOf('?')) : '';
  var SHEET = { pos:{"judge0": [0, 0, 136, 148], "judge1": [138, 0, 122, 150], "judge2": [262, 0, 121, 148], "judge3": [385, 0, 124, 151], "judge4": [511, 0, 137, 151], "faisal0": [650, 0, 149, 154], "faisal1": [801, 0, 135, 149], "faisal2": [0, 156, 126, 150], "faisal3": [128, 156, 131, 152], "faisal4": [261, 156, 156, 149], "majed0": [419, 156, 170, 159], "majed1": [591, 156, 147, 150], "majed2": [740, 156, 144, 150], "majed3": [0, 317, 146, 150], "majed4": [148, 317, 164, 150], "lawyer0": [314, 317, 111, 144], "lawyer1": [427, 317, 104, 150], "lawyer2": [533, 317, 107, 149], "lawyer3": [642, 317, 120, 150], "client0": [764, 317, 104, 144], "client1": [870, 317, 114, 150], "client2": [0, 469, 105, 149], "client3": [107, 469, 127, 151], "witness0": [236, 469, 122, 160], "witness1": [360, 469, 97, 150], "witness2": [459, 469, 89, 150], "witness3": [550, 469, 97, 151], "clerk0": [649, 469, 119, 162], "clerk1": [770, 469, 93, 152], "clerk2": [865, 469, 85, 147], "clerk3": [0, 633, 104, 151]}, img:null, ready:false, cbs:[] };
  var SPRITE_SET = { judge:'judge', player:'faisal', rival:'majed', salem:'witness', khalid:'clerk', nasser:'client', abdullah:'lawyer' };
  var SPRITE_EXPR = {
    judge:  {normal:0, listen:2, think:1, stern:3, judgment:4, gavel:4, worried:2, shock:3, angry:3, sweat:2, nervous:2, happy:0, smug:0, confident:0},
    faisal: {normal:0, confident:1, happy:1, listen:1, stern:1, smug:1, judgment:1, point:2, present:2, angry:2, think:3, shock:4, worried:4, sweat:4, nervous:4},
    majed:  {normal:0, smug:0, confident:0, happy:0, listen:0, think:1, sweat:2, nervous:2, worried:2, shock:3, angry:4, stern:4, judgment:4},
    witness:{normal:0, confident:0, listen:1, think:1, stern:1, happy:2, worried:1, sweat:1, nervous:1, shock:1, angry:1},
    clerk:  {normal:0, confident:0, think:1, listen:2, happy:2, stern:2, worried:3, sweat:3, nervous:3, shock:3, angry:3},
    client: {normal:0, listen:0, happy:0, confident:0, worried:1, think:1, stern:1, angry:1, sweat:2, nervous:2, shock:3},
    lawyer: {normal:0, confident:1, happy:1, listen:1, stern:1, worried:2, think:2, angry:2, sweat:2, nervous:2, shock:2, present:3}
  };
  (function load(){
    if(typeof Image === 'undefined') return;
    var im = new Image();
    im.onload = function(){ SHEET.img = im; SHEET.ready = true; cache = {}; cacheKeys = []; SHEET.cbs.forEach(function(f){ try{ f(); }catch(e){} }); SHEET.cbs = []; };
    im.src = BASE + 'cast.webp' + VQ;
  })();
  function onReady(f){ if(SHEET.ready) f(); else SHEET.cbs.push(f); }
  function spriteFrame(id, st){
    var set = SPRITE_SET[id]; if(!SHEET.ready || !set) return null;
    var map = SPRITE_EXPR[set], expr = st.expr==='normal' && DEFAULT_EXPR[id] ? DEFAULT_EXPR[id] : st.expr, k;
    if(st.pose==='gavel' || st.pose==='point' || st.pose==='present') k = map[st.pose];
    if(k===undefined) k = map[expr];
    if(k===undefined) k = 0;
    return SHEET.pos[set + k] || SHEET.pos[set + '0'];
  }
  function drawSprite(f, cx, bottom, br){
    g.drawImage(SHEET.img, f[0], f[1], f[2], f[3], Math.round(cx - f[2]/2), Math.round(bottom - f[3] + (br?1:0)), f[2], f[3]);
  }

  /* ---------- environment pieces ---------- */
  function woodWall(x, y, w, h, panelW){
    R(x, y, w, h, WOOD[2]);
    var pw = panelW||40;
    for(var px=x; px<x+w; px+=pw){
      R(px, y, 3, h, WOOD[1]); R(px+3, y, 1, h, WOOD[4]);
      R(px+8, y+8, pw-16, h-16, WOOD[3]);
      R(px+8, y+8, pw-16, 1, WOOD[1]); R(px+8, y+8, 1, h-16, WOOD[1]); R(px+8, y+h-9, pw-16, 1, WOOD[5]); R(px+pw-9, y+8, 1, h-16, WOOD[5]);
      for(var gy=y+12; gy<y+h-10; gy+=5) if(hash(px,gy)<0.6) R(px+11+((gy*7)%(pw-24)), gy, 6, 1, WOOD[2]);
    }
  }
  function fabric(x, y, w, h){
    R(x, y, w, h, EM[2]);
    for(var j=0;j<h;j++) for(var i=0;i<w;i++){
      var u=(i+j)%16, v=(i-j+1600)%16;
      if(u===0||v===0) P(x+i, y+j, EM[3]);
      else if(u===8&&v===8) P(x+i, y+j, GOLD[1]);
    }
    for(var k=0;k<6;k++){ dith(x, y+k*2, w, 1, EM[1], k); }
    dith(x, y, 4, h, EM[1]); dith(x+w-4, y, 4, h, EM[1]);
  }
  function goldBand(x, y, w, h){
    R(x, y, w, h, GOLD[2]); R(x, y, w, 1, GOLD[4]); R(x, y+h-1, w, 1, GOLD[0]);
    for(var i=x;i<x+w;i+=6){ P(i, y+Math.floor(h/2), GOLD[5]); P(i+3, y+Math.floor(h/2), GOLD[1]); }
  }
  function star8(cx, cy, r, c1, c2, c3){
    var pts1=[], pts2=[];
    for(var a=0;a<4;a++){ var t=a*Math.PI/2+Math.PI/4; pts1.push([cx+Math.cos(t)*r, cy+Math.sin(t)*r]); }
    for(var b=0;b<4;b++){ var u=b*Math.PI/2; pts2.push([cx+Math.cos(u)*r*1.05, cy+Math.sin(u)*r*1.05]); }
    poly(pts1, c1); poly(pts2, c1);
    ell(cx, cy, r*0.62, r*0.62, c2); ell(cx, cy, r*0.42, r*0.42, c3); ell(cx, cy, r*0.2, r*0.2, c1);
    for(var k=0;k<8;k++){ var v=k*Math.PI/4; P(cx+Math.cos(v)*r*0.8, cy+Math.sin(v)*r*0.8, GOLD[6]); }
  }
  function scales(cx, y, s){
    s = s||1;
    R(cx-1*s, y, 2*s, 20*s, GOLD[3]); R(cx-12*s, y+3*s, 24*s, 2*s, GOLD[3]); R(cx-12*s, y+3*s, 24*s, 1, GOLD[5]);
    line(cx-11*s, y+5*s, cx-15*s, y+12*s, 1, GOLD[2]); line(cx-11*s, y+5*s, cx-7*s, y+12*s, 1, GOLD[2]);
    line(cx+11*s, y+5*s, cx+7*s, y+12*s, 1, GOLD[2]); line(cx+11*s, y+5*s, cx+15*s, y+12*s, 1, GOLD[2]);
    R(cx-17*s, y+12*s, 12*s, 2*s, GOLD[4]); R(cx+5*s, y+12*s, 12*s, 2*s, GOLD[4]); R(cx-6*s, y+19*s, 12*s, 2*s, GOLD[2]);
  }
  var BAYER = [0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
  function bayer(x,y){ return (BAYER[((y&3)<<2)|(x&3)]+0.5)/16; }
  function lightPool(cx, cy, rx, ry, c){
    for(var j=-ry;j<=ry;j++) for(var i=-rx;i<=rx;i++){ var d = Math.sqrt((i*i)/(rx*rx)+(j*j)/(ry*ry)); if(d<1 && bayer(cx+i,cy+j) < (1-d)*0.55) P(cx+i, cy+j, c); }
  }
  function sconce(x, y){
    lightPool(x, y+4, 26, 22, 'rgba(240,215,160,.13)');
    R(x-2, y+10, 4, 10, GOLD[1]); R(x-6, y+18, 12, 3, GOLD[2]); R(x-5, y-2, 10, 12, '#F6E6B8'); R(x-5, y-2, 10, 1, GOLD[5]); R(x+2, y-1, 3, 10, '#E6CC8E'); R(x-6, y-4, 12, 2, GOLD[3]);
  }
  function papers(x, y, n){
    for(var k=0;k<n;k++){ R(x+k, y-k*2, 34, 3, k%2?IVORY[3]:IVORY[4]); R(x+k, y-k*2+2, 34, 1, IVORY[1]); }
  }
  function mic(x, y, h){
    R(x-5, y, 10, 3, '#1A1A1A'); R(x-4, y, 8, 1, '#3A3A3A');
    for(var k=0;k<h;k++){ var bx = x + Math.round(Math.sin(k/h*1.6)*6); P(bx, y-k, '#2A2A2A'); P(bx+1, y-k, '#151515'); }
    var tx = x + Math.round(Math.sin(1.6)*6);
    R(tx-1, y-h-6, 4, 7, '#111'); P(tx, y-h-6, '#4A4A4A'); P(tx+1, y-h, '#E0533F');
  }
  function bookcase(x, y, w, h){
    R(x, y, w, h, WOOD[1]); R(x+3, y+3, w-6, h-6, WOOD[0]);
    var cols = ['#5A1E1A','#1B3A2C','#B8975A','#22324F','#4A2D17','#7A5A2C','#0F4030','#6B2433','#2A2620'];
    for(var sy=y+6; sy<y+h-10; sy+=30){
      var bx = x+5;
      while(bx < x+w-10){
        var bw = 4+Math.floor(hash(bx,sy)*5), bh = 20+Math.floor(hash(sy,bx)*6), c = cols[Math.floor(hash(bx*3,sy)*cols.length)];
        if(hash(bx,sy*2)<0.08){ bx += 5; continue; }
        R(bx, sy+24-bh, bw, bh, c); R(bx, sy+24-bh, 1, bh, 'rgba(255,255,255,.12)'); R(bx, sy+26-bh+3, bw, 1, GOLD[3]); R(bx, sy+18, bw, 1, GOLD[2]);
        bx += bw+1;
      }
      R(x+3, sy+24, w-6, 4, WOOD[3]); R(x+3, sy+24, w-6, 1, WOOD[5]);
    }
  }
  function windowArch(x, y, w, h, night){
    R(x-4, y-4, w+8, h+8, WOOD[1]); R(x-2, y-2, w+4, h+4, GOLD[1]);
    for(var j=0;j<h;j++){ var t=j/h; var c = night ? (t<0.5?'#1B1F3A':t<0.75?'#3A2A48':'#7A4A3A') : (t<0.6?'#5E8C86':'#8DB7A8'); R(x, y+j, w, 1, c); if(!night && j%3===0) dith(x, y+j, w, 1, '#A9CFC0', j); }
    if(night){ for(var k=0;k<w;k+=1){ var bh = 10+Math.floor(hash(k>>2,7)*34); if(hash(k>>3,3)>0.35) R(x+k, y+h-bh, 1, bh, '#0C0F1A'); } for(var s=0;s<40;s++){ var wx=x+Math.floor(hash(s,1)*w), wy=y+h-4-Math.floor(hash(s,2)*30); P(wx, wy, GOLD[4]); } dith(x, y+h-16, w, 16, '#2A1A26'); }
    R(x+w/2-1, y, 2, h, WOOD[2]); R(x, y+h/2-1, w, 2, WOOD[2]); R(x, y, w, 2, WOOD[2]);
  }
  function lightShaft(x0, y0, x1, y1, wTop, wBot){
    for(var y=y0; y<y1; y++){ var t=(y-y0)/(y1-y0), cx = x0+(x1-x0)*t, w = wTop+(wBot-wTop)*t; for(var x=Math.round(cx-w/2); x<cx+w/2; x++){ var e = 1-Math.abs(x-cx)/(w/2); if(bayer(x,y) < e*0.28*(1-t*0.7)) P(x, y, 'rgba(236,216,166,.16)'); } }
  }
  function deskFront(x, y, w, h, opts){
    opts = opts||{};
    R(x, y, w, 9, WOOD[4]); R(x, y, w, 1, WOOD[6]); R(x, y+8, w, 1, WOOD[1]);
    for(var i=x; i<x+w; i+=3) if(hash(i,y)<0.4) R(i, y+3, 2, 1, WOOD[5]);
    R(x, y+9, w, h-9, WOOD[2]);
    R(x, y+9, w, 3, WOOD[1]);
    goldBand(x, y+12, w, 3);
    var pw = opts.panel||80;
    for(var px=x+10; px+pw<=x+w-6; px+=pw+10){
      R(px, y+22, pw, h-28, WOOD[3]); R(px, y+22, pw, 1, WOOD[1]); R(px, y+22, 1, h-28, WOOD[1]); R(px+pw-1, y+22, 1, h-28, WOOD[5]);
      if(opts.emerald){ R(px+6, y+28, pw-12, h-40, EM[3]); R(px+6, y+28, pw-12, 1, GOLD[2]); R(px+6, y+h-13, pw-12, 1, GOLD[2]); R(px+6, y+28, 1, h-40, GOLD[2]); R(px+pw-7, y+28, 1, h-40, GOLD[2]); dith(px+7, y+29, pw-14, 4, EM[4]); }
    }
  }
  function floorCarpet(y, h){
    R(0, y, W, h, WOOD[1]);
    for(var j=0;j<h;j+=6) R(0, y+j, W, 1, WOOD[0]);
    var vx = W/2;
    poly([[vx-40,y],[vx+40,y],[vx+150,y+h],[vx-150,y+h]], EM[2]);
    poly([[vx-40,y],[vx-34,y],[vx-130,y+h],[vx-150,y+h]], GOLD[1]); poly([[vx+34,y],[vx+40,y],[vx+150,y+h],[vx+130,y+h]], GOLD[1]);
    for(var k=0;k<h;k+=8){ var t=k/h, half = 40+110*t; dith(vx-half+14, y+k, (half-14)*2, 1, EM[3], k); }
  }

  /* ---------- miniature figures for the wide shot ---------- */
  function mini(id, x, y, opts){
    var sp = CAST[id]; if(!sp) return; var sk = SKIN[sp.skin];
    var bodyC = sp.outfit==='bisht'||sp.outfit==='abaya' ? sp.robe[2] : sp.outfit==='coverall' ? sp.cov[2] : sp.outfit==='shirt' ? sp.shirt[2] : sp.outfit==='hivis' ? '#E89A1C' : (sp.thobe||THOBE)[2];
    R(x-7, y+9, 14, 16, bodyC); R(x-7, y+9, 3, 16, 'rgba(255,255,255,.12)');
    if(sp.outfit==='bisht' && sp.trim && sp.trim!=='none'){ R(x-2, y+9, 1, 16, GOLD[3]); R(x+1, y+9, 1, 16, GOLD[3]); R(x-1,y+9,2,16,(sp.thobe||THOBE)[3]); }
    R(x-3, y+1, 6, 8, sk[1]); R(x+1, y+1, 2, 8, sk[2]);
    if(sp.head==='shemagh'||sp.head==='ghutra'){ var c = sp.head==='shemagh' ? SHEMAGH_RED[2] : GHUTRA[2]; R(x-5, y-2, 10, 4, c); R(x-5, y+2, 2, 8, c); R(x+3, y+2, 2, 8, c); R(x-4, y-1, 8, 1, INK); }
    else if(sp.head==='niqab'){ R(x-5, y-2, 10, 12, sp.veil[2]); R(x-3, y+3, 6, 2, sk[1]); P(x-2, y+3, INK); P(x+1, y+3, INK); }
    else if(sp.head==='wrap'){ R(x-4, y-2, 8, 4, SHEMAGH_RED[2]); }
    else { R(x-3, y-1, 6, 3, (sp.hairC||['#000','#111'])[1]); }
    if(sp.beard && sp.beard!=='none' && sp.beard!=='stubble'){ R(x-2, y+6, 4, 3, sp.beardC[1]); }
    P(x-2, y+4, INK); P(x+1, y+4, INK);
  }

  /* ---------- background caches ---------- */
  var BG = {}, FG = {};
  function cached(store, key, draw){
    if(!store[key]){ var c = document.createElement('canvas'); c.width = W; c.height = H; var keep = g; g = c.getContext('2d'); g.imageSmoothingEnabled=false; draw(); g = keep; store[key] = c; }
    return store[key];
  }
  var VIEWS = {
    judge: {
      bg: function(){
        R(0,0,W,H,WOOD[1]);
        woodWall(0, 18, 150, 252, 50); woodWall(330, 18, 150, 252, 50);
        fabric(150, 18, 180, 252);
        R(140, 18, 12, 252, WOOD[3]); R(328, 18, 12, 252, WOOD[3]); R(140,18,2,252,WOOD[5]); R(338,18,2,252,WOOD[1]);
        goldBand(140, 18, 200, 4); goldBand(138, 36, 16, 3); goldBand(326, 36, 16, 3);
        R(0, 0, W, 18, WOOD[0]); goldBand(0, 14, W, 4);
        for(var x=4; x<W; x+=16){ star8(x+4, 7, 4, GOLD[2], GOLD[1], GOLD[3]); }
        lightPool(240, 90, 120, 70, 'rgba(236,216,166,.08)');
        star8(240, 40, 15, GOLD[2], GOLD[1], EM[3]);
        scales(240, 32, 0.6);
        sconce(96, 70); sconce(384, 70);
      },
      fg: function(){
        deskFront(70, 186, 340, 84, {emerald:true, panel:96});
        R(60, 178, 360, 10, WOOD[5]); R(60, 178, 360, 1, WOOD[6]); R(60, 187, 360, 1, WOOD[1]);
        scales(240, 222, 1);
        papers(300, 176, 4); R(302, 168, 30, 2, EM[4]);
        R(108, 172, 24, 6, WOOD[2]); ell(120, 172, 12, 3, WOOD[4]); R(110, 168, 20, 2, GOLD[3]);
        mic(196, 178, 26);
        R(360, 170, 26, 8, GOLD[2]); R(361, 171, 24, 6, GOLD[3]); R(364,173,18,1,GOLD[1]); R(364,175,12,1,GOLD[1]);
      }
    },
    player: {
      bg: function(){
        R(0,0,W,H,EM[1]);
        fabric(0, 0, W, 150);
        windowArch(330, 24, 96, 112, false);
        lightShaft(378, 136, 250, 270, 70, 150);
        woodWall(0, 150, W, 120, 60);
        R(0, 146, W, 6, WOOD[4]); R(0, 146, W, 1, WOOD[6]); goldBand(0, 152, W, 2);
        R(40, 0, 16, 150, WOOD[3]); R(40,0,2,150,WOOD[5]); R(54,0,2,150,WOOD[1]);
        sconce(110, 60);
        R(0, 0, W, 8, WOOD[0]); goldBand(0, 8, W, 2);
      },
      fg: function(){
        deskFront(20, 200, 440, 70, {panel:120});
        papers(110, 196, 3); R(112, 186, 44, 10, EM[3]); R(112, 186, 44, 2, EM[5]); R(112, 186, 4, 10, GOLD[3]);
        R(150, 190, 30, 6, IVORY[4]); R(150, 190, 30, 1, IVORY[5]); line(156,193,176,191,1,'#2A2A2A');
        R(300, 184, 14, 14, EM[3]); R(300, 184, 14, 2, EM[5]); R(316, 186, 12, 12, '#22324F'); R(316,186,12,2,'#3A4C6E');
        R(372, 186, 8, 12, 'rgba(190,225,230,.55)'); R(372, 186, 8, 1, '#E8F6F8'); R(373, 192, 6, 5, 'rgba(150,200,210,.5)');
        mic(250, 200, 18);
      }
    },
    rival: {
      bg: function(){
        R(0,0,W,H,WOOD[1]);
        woodWall(0, 0, 300, 160, 75);
        bookcase(306, 6, 174, 150);
        R(46, 30, 92, 70, GOLD[2]); R(50, 34, 84, 62, EM[1]); star8(92, 65, 22, GOLD[2], EM[2], EM[3]);
        for(var k=0;k<4;k++){ star8(62+k*20, 40, 4, GOLD[1], EM[2], GOLD[3]); }
        sconce(200, 56);
        woodWall(0, 160, W, 110, 80); R(0, 156, W, 6, WOOD[4]); R(0,156,W,1,WOOD[6]);
      },
      fg: function(){
        deskFront(20, 200, 440, 70, {panel:120});
        R(330, 170, 56, 30, '#1A1E1C'); R(332, 172, 52, 24, '#0E2A22'); dith(334, 174, 48, 20, '#16573F'); R(334, 176, 30, 2, EM[6]); R(334, 181, 40, 1, EM[5]); R(334, 185, 24, 1, EM[5]);
        R(322, 198, 72, 4, '#2A2E2C'); R(322, 198, 72, 1, '#4A4E4C');
        for(var k=0;k<4;k++){ R(96, 196-k*6, 44, 6, ['#5A1E1A','#1B3A2C','#22324F','#4A2D17'][k]); R(96,196-k*6,44,1,'rgba(255,255,255,.15)'); R(132, 196-k*6, 4, 6, GOLD[3]); }
        R(410, 186, 12, 12, IVORY[4]); R(422, 189, 3, 5, IVORY[3]); R(410,186,12,2,'#3A2414');
        mic(250, 200, 18);
      }
    },
    lobby: {
      bg: function(){
        R(0,0,W,H,EM[1]);
        fabric(0, 0, W, 210);
        windowArch(30, 26, 170, 130, true);
        bookcase(300, 20, 170, 180);
        R(222, 40, 50, 38, GOLD[2]); R(225, 43, 44, 32, IVORY[4]); R(230, 48, 34, 3, EM[4]); for(var k=0;k<4;k++) R(232, 55+k*4, 30, 1, IVORY[1]); ell(256, 70, 3, 3, '#9C2B22');
        R(0, 0, W, 6, WOOD[0]);
        R(0, 200, W, 70, WOOD[1]);
      },
      fg: function(){
        R(0, 214, W, 10, WOOD[5]); R(0, 214, W, 1, WOOD[6]); R(0, 223, W, 1, WOOD[1]);
        R(0, 224, W, 46, WOOD[3]); goldBand(0, 226, W, 2);
        lightPool(86, 180, 60, 40, 'rgba(240,210,150,.10)');
        R(80, 208, 16, 6, GOLD[1]); R(86, 168, 3, 40, GOLD[2]); line(88,170,104,160,2,GOLD[2]); poly([[96,150],[122,150],[128,166],[90,166]], EM[4]); R(92, 165, 34, 2, '#F6E6B8');
        papers(330, 212, 3); R(390, 204, 20, 10, EM[3]); R(390,204,20,2,EM[5]);
      }
    },
    witness: {
      bg: function(){
        R(0,0,W,H,WOOD[1]);
        woodWall(0, 0, W, 270, 60);
        fabric(120, 0, 240, 170);
        R(112, 0, 8, 170, WOOD[4]); R(360, 0, 8, 170, WOOD[4]); goldBand(112, 170, 256, 3);
        sconce(70, 70); sconce(410, 70);
      },
      fg: function(){
        R(130, 190, 220, 8, WOOD[5]); R(130, 190, 220, 1, WOOD[6]);
        for(var x=136; x<346; x+=14){ R(x, 198, 6, 30, WOOD[3]); R(x, 198, 2, 30, WOOD[5]); R(x-1, 198, 8, 2, GOLD[2]); }
        deskFront(130, 228, 220, 42, {panel:60});
        mic(300, 190, 20);
      }
    },
    wide: {
      bg: function(){
        R(0,0,W,H,WOOD[0]);
        woodWall(0, 0, W, 122, 48);
        fabric(150, 0, 180, 104);
        R(142,0,8,104,WOOD[4]); R(330,0,8,104,WOOD[4]);
        star8(240, 26, 16, GOLD[2], GOLD[1], EM[3]);
        windowArch(36, 14, 60, 74, false); windowArch(384, 14, 60, 74, false);
        lightShaft(66, 88, 130, 230, 40, 90); lightShaft(414, 88, 350, 230, 40, 90);
        [120, 360].forEach(function(x){ R(x, 0, 2, 26, GOLD[1]); ell(x+1, 30, 7, 5, GOLD[3]); R(x-6, 30, 14, 3, '#F6E6B8'); lightPool(x+1, 34, 26, 14, 'rgba(240,215,160,.10)'); });
        floorCarpet(122, 148);
        /* judge bench */
        R(160, 84, 160, 8, WOOD[5]); R(160,84,160,1,WOOD[6]);
        R(166, 92, 148, 40, WOOD[2]); goldBand(166, 95, 148, 2); R(196, 102, 88, 26, EM[3]); R(196,102,88,1,GOLD[2]); R(196,127,88,1,GOLD[2]); scales(240, 104, 0.8);
        /* clerk desk and witness stand */
        R(112, 104, 46, 6, WOOD[5]); R(114, 110, 42, 22, WOOD[3]); goldBand(114, 112, 42, 1);
        R(330, 100, 44, 5, WOOD[5]); R(332, 105, 40, 26, WOOD[3]); for(var bx=334;bx<370;bx+=6) R(bx, 106, 2, 18, WOOD[2]);
        /* gallery rail */
        R(0, 252, W, 4, WOOD[5]); for(var gx=4; gx<W; gx+=12){ R(gx, 256, 4, 14, WOOD[3]); R(gx, 256, 1, 14, WOOD[5]); }
      },
      fg: function(){
        [[30,182,170],[280,182,170]].forEach(function(t){
          R(t[0], t[1], t[2], 7, WOOD[5]); R(t[0], t[1], t[2], 1, WOOD[6]); R(t[0]+4, t[1]+7, t[2]-8, 34, WOOD[2]); goldBand(t[0]+4, t[1]+10, t[2]-8, 2);
          papers(t[0]+30, t[1]-2, 2); mic(t[0]+t[2]/2, t[1], 10);
        });
      }
    }
  };

  /* ---------- public: draw a view ---------- */
  var LAYOUT = {
    judge:   {who:'judge',  cx:240, top:50, deskY:180},
    player:  {who:'player', cx:224, top:36, deskY:200},
    rival:   {who:'rival',  cx:252, top:34, deskY:200},
    lobby:   {who:'client', cx:240, top:42, deskY:214},
    witness: {who:'witness',cx:240, top:42, deskY:190}
  };
  function scene(ctx, view, o){
    g = ctx; g.imageSmoothingEnabled = false;
    var v = VIEWS[view] || VIEWS.judge;
    g.drawImage(cached(BG, view, v.bg), 0, 0);
    var L = LAYOUT[view], cast = o.cast || {};
    if(view==='wide'){
      mini('judge', 240, 64); mini('clerk', 135, 88); if(cast.witness) mini(cast.witness, 352, 82);
      mini('rival', 115, 154); if(cast.client) mini(cast.client, 335, 154); mini('player', 375, 154);
      g.drawImage(cached(FG, view, v.fg), 0, 0);
      return;
    }
    if(L){
      var id = L.who==='client' ? cast.client : L.who==='witness' ? cast.witness : L.who;
      if(id){
        var st = o.st || {expr:'normal'};
        var st2 = {expr:st.expr, pose:st.pose, dir:st.dir, mouth:st.mouth, blink:st.blink, breath:st.breath};
        if(view==='judge' && o.gavelT>=0) st2.pose = 'gavel';
        var fr = spriteFrame(id, st2);
        if(fr) drawSprite(fr, L.cx, L.deskY + 16, st2.breath);
        else cachedPerson(id, L.cx, L.top, st2, {deskY:L.deskY, gavelT:o.gavelT});
      }
    }
    g.drawImage(cached(FG, view, v.fg), 0, 0);
    if(view==='judge' && o.gavelT>=0 && o.gavelT<0.32){
      for(var k=0;k<6;k++){ var a=Math.PI+k*Math.PI/5; line(132+Math.cos(a)*18, 172+Math.sin(a)*8, 132+Math.cos(a)*28, 172+Math.sin(a)*14, 1, GOLD[5]); }
    }
  }

  /* ---------- public: portraits and documents ---------- */
  function portrait(canvas, id, expr){
    var fr = spriteFrame(id, {expr:expr||'normal'});
    if(fr){
      var k0 = canvas.getContext('2d'); k0.imageSmoothingEnabled = false;
      k0.fillStyle = EM[2]; k0.fillRect(0,0,canvas.width,canvas.height);
      var side = Math.round(fr[2]*0.78);
      k0.drawImage(SHEET.img, fr[0] + Math.round((fr[2]-side)/2), fr[1], side, side, 0, 0, canvas.width, canvas.height);
      return;
    }
    var c = document.createElement('canvas'); c.width = W; c.height = H;
    var keep = g; g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    person(id, 240, 40, {expr:expr||'normal'}, {deskY:400});
    g = keep; finish(c);
    var k = canvas.getContext('2d'); k.imageSmoothingEnabled = false;
    k.fillStyle = EM[2]; k.fillRect(0,0,canvas.width,canvas.height);
    k.drawImage(c, 240-40, 32, 80, 80, 0, 0, canvas.width, canvas.height);
  }
  var DOC_KIND = { contract:'contract', letter:'letter', notice:'letter', attendance:'table', bank:'bank', release:'release', email:'email' };
  function doc(canvas, key){
    var kind = DOC_KIND[key] || 'letter', w = canvas.width, h = canvas.height;
    var keep = g; g = canvas.getContext('2d'); g.imageSmoothingEnabled = false;
    R(0,0,w,h,EM[1]);
    var px = Math.round(w*0.14), py = Math.round(h*0.08), pw = w-px*2, ph = h-py*2;
    if(kind==='email'){
      R(px-2, py+4, pw+4, ph-8, '#1A1E1C'); R(px, py+6, pw, ph-14, '#0E2A22'); R(px+3, py+9, pw-6, 6, EM[4]);
      var ex = px+pw/2, ey = py+ph/2-4; R(ex-10, ey-6, 20, 13, IVORY[4]); line(ex-10, ey-6, ex, ey+1, 1, IVORY[1]); line(ex+10, ey-6, ex, ey+1, 1, IVORY[1]);
      for(var k=0;k<3;k++) R(px+5, py+ph-26+k*4, pw-12-k*6, 1, EM[5]);
      g = keep; return;
    }
    R(px+2, py+2, pw, ph, 'rgba(0,0,0,.35)');
    R(px, py, pw, ph, IVORY[4]); R(px, py, pw, 1, IVORY[5]); R(px+pw-1, py, 1, ph, IVORY[1]); R(px, py+ph-1, pw, 1, IVORY[0]);
    dith(px+pw-6, py+ph-6, 6, 6, IVORY[2]);
    var lx = px+4, lw = pw-8, y = py+4;
    if(kind==='letter'||kind==='release'){ R(px, py, pw, 5, EM[3]); R(px, py+5, pw, 1, GOLD[3]); y = py+9; }
    if(kind==='bank'){ R(px, py, pw, 6, '#22324F'); R(px+3, py+2, 6, 2, GOLD[4]); y = py+10; }
    if(kind==='contract'){ R(lx+lw/2-6, y, 12, 2, IVORY[0]); y += 5; }
    if(kind==='table'||kind==='bank'){
      var rows = Math.floor((ph-(y-py)-6)/4);
      for(var r=0;r<rows;r++){ R(lx, y+r*4, lw, 1, IVORY[2]); if(r===0) R(lx, y, lw, 3, IVORY[2]); }
      R(lx+Math.floor(lw*0.35), y, 1, rows*4, IVORY[1]); R(lx+Math.floor(lw*0.7), y, 1, rows*4, IVORY[1]);
      if(kind==='bank'){ for(var r2=2;r2<rows;r2+=1) if(r2%3) R(lx+lw-8, y+r2*4+1, 6, 2, r2>rows-4 ? '#C9473A' : EM[4]); }
      else { for(var r3=1;r3<rows;r3++) R(lx+Math.floor(lw*0.72)+2, y+r3*4+1, 3, 2, EM[4]); }
    } else {
      var lines = Math.floor((ph-(y-py)-14)/3);
      for(var l=0;l<lines;l++) R(lx, y+l*3, l===lines-1 ? lw*0.5 : lw - (l%4===3?6:0), 1, IVORY[1]);
    }
    if(kind==='contract'||kind==='release'||kind==='letter'){
      var sx = px+pw-12, sy = py+ph-11; ell(sx, sy, 5, 5, kind==='release'?'#22324F':'#9C2B22'); ell(sx, sy, 3, 3, kind==='release'?'#3A4C6E':'#C9473A');
      line(px+4, py+ph-7, px+16, py+ph-10, 1, '#2A2A3A'); line(px+16, py+ph-10, px+20, py+ph-6, 1, '#2A2A3A');
    }
    g = keep;
  }

  /* ---------- development: character sheet ---------- */
  function sheet(ctx, ids, expr, pose){
    g = ctx; g.imageSmoothingEnabled = false;
    var n = ids.length, cw = Math.floor(ctx.canvas.width / n);
    ids.forEach(function(id, k){
      var c = document.createElement('canvas'); c.width = W; c.height = H; var keep = g; g = c.getContext('2d'); g.imageSmoothingEnabled=false;
      person(id, 240, 40, {expr:expr||'normal', pose:pose||null, dir:1}, {deskY:230, gavelT:-1}); g = keep; finish(c);
      R(k*cw, 0, cw, H, EM[1]); g.drawImage(c, 240-cw/2, 0, cw, H, k*cw, 0, cw, H);
    });
  }

  window.JaliCourtArt = { W:W, H:H, CAST:CAST, EXPR:EXPR, scene:scene, portrait:portrait, doc:doc, sheet:sheet, mini:mini, onReady:onReady };
})();
