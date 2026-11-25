(function(){
var $=function(s,c){return (c||document).querySelector(s)},$$=function(s,c){return [].slice.call((c||document).querySelectorAll(s))};
var toast=document.createElement('div');toast.className='toast';document.body.appendChild(toast);
function say(m){toast.textContent=m;toast.classList.add('on');clearTimeout(say.t);say.t=setTimeout(function(){toast.classList.remove('on')},2600)}
var nav=$('nav'),hb=$('.hamburger');
hb.onclick=function(){hb.classList.toggle('open');nav.classList.toggle('open')};
$$('nav li').forEach(function(li){li.onclick=function(){hb.classList.remove('open');nav.classList.remove('open')}});
addEventListener('scroll',function(){$('header').classList.toggle('stuck',scrollY>10)},{passive:true});
$$('#input').forEach(function(box){
 var inp=$('input',box),btn=$('button',box),m=document.createElement('p');m.className='msg';box.after(m);
 btn.onclick=function(){var ok=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(inp.value.trim());box.classList.remove('bad');void box.offsetWidth;
  if(!ok){box.classList.add('bad');m.style.color='#c0392b';m.textContent='Please enter a valid email address.';return}
  m.style.color='#2f7d4f';m.textContent='Thanks! A quote will be sent to '+inp.value.trim();say('Quote request sent ✓');inp.value=''};
 inp.addEventListener('keydown',function(e){if(e.key==='Enter')btn.click()})});
$$('.house').forEach(function(h){var s=$('.star',h);s.style.cursor='pointer';var n=5;s.title='Click to like';s.onclick=function(){h.classList.toggle('liked');say(h.classList.contains('liked')?'Saved to favourites ♥':'Removed from favourites')}});
$$('.book').forEach(function(b){b.onclick=function(){say('Booking request received. We will call you soon.')}});
$$('.more').forEach(function(b){b.onclick=function(){$('.four').scrollIntoView({behavior:'smooth'})}});
var wrap=$('.info');if(wrap){var bt=$$('button',wrap),d=document.createElement('div');d.className='btns';bt[0].before(d);bt.forEach(function(b){d.appendChild(b)})}
$$('.two,.four,.six,.first,.house,.number div').forEach(function(e){e.classList.add('rv')});
var io=new IntersectionObserver(function(es){es.forEach(function(en){if(!en.isIntersecting)return;en.target.classList.add('in');io.unobserve(en.target);
 var h=$('h3',en.target);if(en.target.parentNode.classList.contains('number')&&h){var t=parseInt(h.textContent),s=performance.now();(function f(x){var p=Math.min((x-s)/1400,1);h.textContent=Math.round(t*(1-Math.pow(1-p,3)))+'+';if(p<1)requestAnimationFrame(f)})(s)}})},{threshold:.15});
$$('.rv').forEach(function(e){io.observe(e)});
$$('.house.liked').length;
})();
