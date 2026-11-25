(function(){
var $=function(s,c){return (c||document).querySelector(s)},$$=function(s,c){return [].slice.call((c||document).querySelectorAll(s))};
var t=document.createElement('div');t.className='t-toast';document.body.appendChild(t);
function say(m){t.textContent=m;t.classList.add('on');clearTimeout(say.i);say.i=setTimeout(function(){t.classList.remove('on')},2600)}
addEventListener('scroll',function(){$('.navbar').classList.toggle('stuck',scrollY>10)},{passive:true});
var ids=['top','how','benefits'],sec=[$('.hero-section'),$('.how-tere-section'),$('.tere-benefits-section')];
sec[0].id='top';sec[1].id='how';sec[2].id='benefits';
var links=$$('.nav-link');links[0].href='#top';links[1].href='#how';links[2].href='#benefits';
$$('.nav-link').forEach(function(a){a.addEventListener('click',function(){var c=$('#navbarSupportedContent');if(c.classList.contains('show')&&window.bootstrap)bootstrap.Collapse.getOrCreateInstance(c).hide()})});
document.documentElement.style.scrollBehavior='smooth';$$('section').forEach(function(s){s.style.scrollMarginTop='70px'});
$$('.downbtn,.footer-download-btn').forEach(function(b){b.onclick=function(){say('Redirecting to the store… (demo)')}});
var f=$('.download-form'),inp=$('.phone-input'),m=document.createElement('p');m.className='t-msg';f.appendChild(m);
f.addEventListener('submit',function(e){e.preventDefault();var d=inp.value.replace(/\D/g,'');inp.classList.remove('bad');void inp.offsetWidth;
 if(d.length<10||d.length>13){inp.classList.add('bad');m.textContent='Enter a valid mobile number (10 to 13 digits).';return}
 m.textContent='Link sent to +'+d+' ✓';say('Download link sent!');inp.value=''});
inp.addEventListener('input',function(){this.value=this.value.replace(/[^\d+\s-]/g,'');this.classList.remove('bad')});
var steps=$$('.work-step'),dots=$$('.how-dots span'),cur=0,timer;
function go(i){cur=i;steps.forEach(function(s,n){s.classList.toggle('active',n===i)});dots.forEach(function(d,n){d.classList.toggle('active',n===i)})}
function auto(){clearInterval(timer);timer=setInterval(function(){go((cur+1)%steps.length)},2800)}
dots.forEach(function(d,n){d.onclick=function(){go(n);auto()}});steps.forEach(function(s,n){s.onmouseenter=function(){go(n);clearInterval(timer)};s.onmouseleave=auto;s.onclick=function(){go(n)}});
go(0);auto();
$$('.how-title,.how-subtitle,.work-step,.benefit-card,.benefits-title,.footer-column').forEach(function(e){if(!e.classList.contains('work-step'))e.classList.add('rv')});
var io=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target)}})},{threshold:.12});
$$('.rv').forEach(function(e){io.observe(e)});
})();
