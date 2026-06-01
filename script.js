var starBox=document.getElementById('stars');
  for(var i=0;i<200;i++){var s=document.createElement('div');s.className='star';var sz=Math.random()*2.4+0.8;if(sz>2.4)s.className+=' big';s.style.width=sz+'px';s.style.height=sz+'px';s.style.left=Math.random()*100+'%';s.style.top=Math.random()*100+'%';s.style.animationDelay=Math.random()*3+'s';s.style.animationDuration=(2+Math.random()*3)+'s';starBox.appendChild(s);}

  var prog=document.getElementById('prog');var starsEl=document.getElementById('stars');var rocket=document.getElementById('rocket');
  var htrack=document.getElementById('htrack');var horiz=document.getElementById('s-childhood');
  var isMobile=function(){return window.innerWidth<=780;};

  /* lerp ONLY for the rocket (decorative). The page/track motion is bound directly
     to scroll position so dvertical<->horizontal transitions never lag or stutter. */
  var cur={top:50,left:78,scale:1,tilt:0,op:1};
  var tgt={top:50,left:78,scale:1,tilt:0,op:1};
  function lerp(a,b,t){return a+(b-a)*t;}

  /* track update runs synchronously on scroll = perfectly locked to the page */
  var hsticky=document.getElementById('hsticky');
  function updateTrack(){
    if(isMobile()){htrack.style.transform='';hsticky.style.transform='';return;}
    var total=horiz.offsetHeight-window.innerHeight;   /* scroll distance inside .horiz */
    var rect=horiz.getBoundingClientRect();
    var passed=Math.min(Math.max(-rect.top,0),total);  /* clamp 0..total */
    var hx=Math.min(passed/(total*0.6),1);             /* finish slide in first 60% */
    /* pin the panel to the viewport by translating it down as we scroll through .horiz */
    hsticky.style.transform='translateY('+passed+'px)';
    /* slide the two-panel track sideways: 0 -> -100vw (second panel into view) */
    htrack.style.transform='translateX(-'+(hx*100)+'vw)';
  }

  /* each story section + the rocket's escape X for that section (opposite its text) */
  var LEFT_X=22, RIGHT_X=84;   /* rocket parking spots (vw %) */
  var zones=[
    {el:document.getElementById('s-awaken'),   fleeX:RIGHT_X},  /* text left  -> rocket right */
    {el:document.getElementById('s-school'),   fleeX:LEFT_X},   /* text right -> rocket left  */
    {el:document.getElementById('s-skills'),   fleeX:LEFT_X},   /* text right -> rocket left  */
    {el:document.getElementById('s-projects'), fleeX:RIGHT_X}   /* text left  -> rocket right */
  ];

  /* blend each zone's escape position by how close its centre is to the viewport
     centre. as one section hands off to the next, the target glides continuously
     instead of snapping -> the rocket genuinely dodges away from the text. */
  function fleeTarget(){
    var vc=window.innerHeight/2, vh=window.innerHeight;
    var sumW=0, sumX=0;
    for(var i=0;i<zones.length;i++){
      if(!zones[i].el)continue;
      var r=zones[i].el.getBoundingClientRect();
      var c=r.top+r.height/2;
      var dist=Math.abs(c-vc)/vh;          /* 0 = dead centre */
      var w=Math.max(0,1-dist);            /* triangular falloff */
      w=w*w;                               /* sharpen a touch */
      sumW+=w; sumX+=w*zones[i].fleeX;
    }
    if(sumW<0.001)return 53;               /* between zones: drift to mid */
    return sumX/sumW;
  }

  function compute(){
    var h=document.documentElement.scrollHeight-window.innerHeight;
    var p=Math.min(window.scrollY/h,1);
    prog.style.width=(p*100)+'%';
    starsEl.style.opacity=p>0.42?Math.min(1,(p-0.42)/0.22):0;

    if(p<0.07){
      /* LAUNCH: shoots up and to the right, nose UP */
      var a=p/0.07;
      tgt.top=50-a*34;tgt.left=78+a*5;tgt.scale=1+a*0.18;tgt.tilt=a*12;tgt.op=1;
    }else{
      /* DESCENT: flip nose-down, ride down the page, continuously flee the text */
      var b=(p-0.07)/0.93;
      tgt.top=16+b*74;
      tgt.scale=1.18-b*0.5;
      var fx=fleeTarget();
      tgt.left=fx;
      var flip=Math.min(b/0.18,1);
      /* bank toward whichever way it's currently sliding (computed in animate) */
      tgt.tilt=12+flip*168;
      tgt.op=p>0.93?Math.max(0,1-(p-0.93)*15):1;
    }
  }

  function onScroll(){updateTrack();compute();}
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',onScroll);

  /* rocket-only smoothing loop */
  var prevLeft=null;
  function animate(){
    var e=0.12;
    cur.top=lerp(cur.top,tgt.top,e);
    var beforeLeft=cur.left;
    cur.left=lerp(cur.left,tgt.left,0.05);   /* slow, graceful horizontal glide */
    cur.scale=lerp(cur.scale,tgt.scale,e);
    /* bank: lean into the direction of horizontal travel */
    var vx=cur.left-beforeLeft;              /* +right / -left */
    var bank=Math.max(-22,Math.min(22,vx*9));
    cur.tilt=lerp(cur.tilt,tgt.tilt+bank,0.08);
    cur.op=lerp(cur.op,tgt.op,e);
    rocket.style.top=cur.top+'vh';
    rocket.style.left=cur.left+'%';
    rocket.style.transform='translateX(-50%) rotate('+cur.tilt+'deg) scale('+cur.scale+')';
    rocket.style.opacity=cur.op;
    requestAnimationFrame(animate);
  }
  compute();updateTrack();cur=JSON.parse(JSON.stringify(tgt));requestAnimationFrame(animate);

  var io=new IntersectionObserver(function(e){e.forEach(function(x){if(x.isIntersecting)x.target.classList.add('show')})},{threshold:.15});
  document.querySelectorAll('.reveal').forEach(function(el,i){el.style.transitionDelay=(i%4*0.08)+'s';io.observe(el)});

  var navA=document.querySelectorAll('.sb-nav a');
  var secs=document.querySelectorAll('section[id]');
  var so=new IntersectionObserver(function(e){e.forEach(function(x){if(x.isIntersecting){var id=x.target.id;navA.forEach(function(a){a.classList.toggle('active',a.getAttribute('href')==='#'+id)})}})},{threshold:.4});
  secs.forEach(function(s){so.observe(s)});
  document.querySelectorAll('.sb-nav a').forEach(function(a){a.addEventListener('click',function(){document.getElementById('sbnav').classList.remove('open')})});

  function setLang(lang){
    document.documentElement.lang=lang;
    document.querySelectorAll('[data-'+lang+']').forEach(function(el){el.innerHTML=el.getAttribute('data-'+lang)});
    document.getElementById('btn-tr').classList.toggle('active',lang==='tr');
    document.getElementById('btn-en').classList.toggle('active',lang==='en');
  }
