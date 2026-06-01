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
    var hx=Math.min(passed/(total*0.92),1);            /* 0..1 across the whole sequence */
    hsticky.style.transform='translateY('+passed+'px)';

    /* hx 0..0.5  : hero -> "HİKAYE BAŞLIYOR"  (pure right, X 0 -> -100vw)
       hx 0.5..1  : "BAŞLIYOR" -> "OYUNLAR"    (DIAGONAL: continue right AND drop down) */
    var x, y=0;
    if(hx<=0.5){
      x=(hx/0.5)*100;                 /* 0 -> 100  (=> -100vw) */
    }else{
      var d=(hx-0.5)/0.5;             /* 0..1 over the diagonal leg */
      x=100+d*100;                    /* 100 -> 200 (=> -200vw) */
      y=d*40;                         /* slide track DOWN up to 40vh => diagonal feel */
    }
    htrack.style.transform='translate3d(-'+x+'vw,-'+y+'vh,0)';
  }

  /* expose horizontal progress for rocket choreography */
  function horizProgress(){
    var total=horiz.offsetHeight-window.innerHeight;
    var rect=horiz.getBoundingClientRect();
    var passed=Math.min(Math.max(-rect.top,0),total);
    return passed/total;
  }

  /* gather the actual on-screen text blocks; rocket flees to the opposite horizontal side */
  var LEFT_X=20, RIGHT_X=86;
  var textBlocks=[];
  function collectBlocks(){
    textBlocks=[];
    var nodes=document.querySelectorAll('#s-awaken .story,#s-school .story,#s-skills .skillblock,#s-projects .b-soon,#iletisim .body');
    for(var i=0;i<nodes.length;i++)textBlocks.push(nodes[i]);
  }

  /* find the text block nearest the rocket's current screen Y, return the X to flee to */
  function fleeTarget(rocketTopVH){
    var ry=rocketTopVH/100*window.innerHeight;   /* rocket Y in px */
    var vw=window.innerWidth, best=null, bestD=1e9;
    for(var i=0;i<textBlocks.length;i++){
      var r=textBlocks[i].getBoundingClientRect();
      var c=r.top+r.height/2;
      var d=Math.abs(c-ry);
      if(d<bestD){bestD=d;best=r;}
    }
    if(!best)return 53;
    /* only react when the block is reasonably near the rocket vertically */
    var influence=Math.max(0,1-bestD/(window.innerHeight*0.7));
    var blockCenterX=(best.left+best.right)/2;
    /* if text is on the left half -> flee right; else flee left */
    var target=(blockCenterX < vw/2)?RIGHT_X:LEFT_X;
    /* blend between mid (53) and full flee by influence so it eases in/out */
    return 53+(target-53)*influence;
  }

  function compute(){
    var h=document.documentElement.scrollHeight-window.innerHeight;
    var p=Math.min(window.scrollY/h,1);
    prog.style.width=(p*100)+'%';
    starsEl.style.opacity=p>0.45?Math.min(1,(p-0.45)/0.22):0;

    var hp=isMobile()?1:horizProgress();   /* 0..1 within the horizontal section */
    var rect=horiz.getBoundingClientRect();
    var horizDone=rect.bottom<=window.innerHeight+2;  /* horizontal section fully passed */

    if(!horizDone && !isMobile()){
      if(hp<=0.5){
        /* LEG 1 (pure right): rocket lifts off and climbs, nose up-right */
        var a=hp/0.5;
        tgt.top=60-a*36;         /* 60 -> 24vh climbing */
        tgt.left=64+a*18;        /* 64 -> 82 : moves right with the slide */
        tgt.scale=1+a*0.16;
        tgt.tilt=a*45;           /* 0 -> 45deg : nose tipping toward down-right */
        tgt.op=1;
      }else{
        /* LEG 2 (diagonal down-right): rocket DIVES toward the corner like it's plunging */
        var d=(hp-0.5)/0.5;
        tgt.top=24+d*60;         /* 24 -> 84vh : drops down */
        tgt.left=82-d*4;         /* stays on the right side */
        tgt.scale=1.16-d*0.2;
        tgt.tilt=45+d*90;        /* 45 -> 135deg : full diagonal nose-down-right dive */
        tgt.op=1;
      }
    }else{
      /* VERTICAL PHASE: nose-down, descend, and flee the text blocks */
      var b=Math.min(Math.max((p-0.34)/0.66,0),1);
      tgt.top=20+b*70;
      tgt.scale=0.98-b*0.28;
      tgt.left=fleeTarget(tgt.top);
      tgt.tilt=180;              /* pointing straight down */
      tgt.op=p>0.94?Math.max(0,1-(p-0.94)*16):1;
    }
  }

  function onScroll(){updateTrack();compute();}
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',function(){collectBlocks();onScroll();});

  /* rocket-only smoothing loop */
  function animate(){
    var e=0.12;
    cur.top=lerp(cur.top,tgt.top,e);
    var beforeLeft=cur.left;
    cur.left=lerp(cur.left,tgt.left,0.1);    /* quick enough to actually dodge the text */
    cur.scale=lerp(cur.scale,tgt.scale,e);
    var vx=cur.left-beforeLeft;
    var bank=Math.max(-24,Math.min(24,vx*10));
    cur.tilt=lerp(cur.tilt,tgt.tilt+bank,0.1);
    cur.op=lerp(cur.op,tgt.op,e);
    rocket.style.top=cur.top+'vh';
    rocket.style.left=cur.left+'%';
    rocket.style.transform='translateX(-50%) rotate('+cur.tilt+'deg) scale('+cur.scale+')';
    rocket.style.opacity=cur.op;
    requestAnimationFrame(animate);
  }
  collectBlocks();compute();updateTrack();cur=JSON.parse(JSON.stringify(tgt));requestAnimationFrame(animate);
  window.addEventListener('load',collectBlocks);

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
