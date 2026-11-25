(function(){
var $=function(s,c){return (c||document).querySelector(s)},$$=function(s,c){return [].slice.call((c||document).querySelectorAll(s))};
var t=document.createElement('div');t.className='nx-toast';document.body.appendChild(t);
function say(m){t.textContent=m;t.classList.add('on');clearTimeout(say.i);say.i=setTimeout(function(){t.classList.remove('on')},2400)}
addEventListener('scroll',function(){$('.navbar').classList.toggle('stuck',scrollY>10)},{passive:true});
$$('.nav-link').forEach(function(a){a.onclick=function(e){e.preventDefault();$$('.nav-link').forEach(function(x){x.classList.remove('active')});a.classList.add('active')}});
$$('.registerBtn').forEach(function(b){b.onclick=function(e){e.preventDefault();say('Thanks for registering your interest!')}});
$$('h5.fw-bold').forEach(function(h){var raw=h.textContent.trim();if(!/^[\d,]+$/.test(raw))return;var to=parseInt(raw.replace(/,/g,'')),done=false;
 h.textContent='0';new IntersectionObserver(function(es,o){if(es[0].isIntersecting&&!done){done=true;o.disconnect();var s=performance.now();(function f(x){var p=Math.min((x-s)/1600,1);h.textContent=Math.round(to*(1-Math.pow(1-p,3))).toLocaleString();if(p<1)requestAnimationFrame(f)})(s)}}).observe(h)});
var fi=$('.footerInput');if(fi){var m=document.createElement('div');m.className='nx-msg';fi.parentNode.appendChild(m);
 function sub(){var ok=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(fi.value.trim());m.textContent=ok?'Subscribed ✓':'Please enter a valid email';m.style.color=ok?'#8fe3a1':'#ff9b9b';if(ok){say('Subscribed to our newsletter');fi.value=''}}
 fi.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();sub()}});var ic=$('.inputIcon');if(ic){ic.style.cursor='pointer';ic.onclick=sub}}
$$('.myCard,.container>h2,.row.flex-column').forEach(function(e){e.classList.add('rv')});
var io=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target)}})},{threshold:.12});
$$('.rv').forEach(function(e){io.observe(e)});
})();
