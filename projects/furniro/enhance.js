(function(){
var $=function(s,c){return (c||document).querySelector(s)},$$=function(s,c){return [].slice.call((c||document).querySelectorAll(s))};
var t=document.createElement('div');t.className='f-toast';document.body.appendChild(t);
function say(m){t.textContent=m;t.classList.add('on');clearTimeout(say.i);say.i=setTimeout(function(){t.classList.remove('on')},2400)}
addEventListener('scroll',function(){$('.navbar').classList.toggle('stuck',scrollY>10)},{passive:true});
var cartA=$('.header-icons a:last-child'),badge=document.createElement('span'),n=0;badge.className='cart-count';cartA.appendChild(badge);
$$('.cartbtn').forEach(function(b){b.onclick=function(){n++;badge.textContent=n;badge.classList.add('on');var nm=$('.card-title',b.closest('.card')).textContent;say(nm+' added to cart ('+n+')')}});
$$('.hover-overlay span').forEach(function(s){var tx=s.textContent;s.style.cursor='pointer';
 s.onclick=function(){if(tx.indexOf('Like')>-1){s.classList.toggle('like-on');s.textContent=s.classList.contains('like-on')?'♥ Liked':'♡ Like'}else if(tx.indexOf('Share')>-1){var u=location.href;(navigator.clipboard?navigator.clipboard.writeText(u):Promise.reject()).then(function(){say('Link copied')}).catch(function(){say('Share this page!')})}else say('Added to compare list')}});
var wish=$('.header-icons a:nth-child(3)');wish.onclick=function(e){e.preventDefault();say($$('.like-on').length+' item(s) in your wishlist')};
$$('.header-icons a').forEach(function(a){if(a!==cartA&&a!==wish)a.onclick=function(e){e.preventDefault();say('Demo only')}});
$$('.nav-link').forEach(function(a){a.onclick=function(e){e.preventDefault();$$('.nav-link').forEach(function(x){x.classList.remove('active')});a.classList.add('active')}});
var prod=$$('.container h2').filter(function(h){return h.textContent.indexOf('Our Products')>-1})[0];
if(prod){var cards=$$('.card.two');cards.forEach(function(c){var tx=$('.card-text',c).textContent.toLowerCase();c.dataset.k=/sofa/.test(tx)?'sofa':/chair/.test(tx)?'chair':'other'});
 var f=document.createElement('div');f.className='filters';['all','chair','sofa','other'].forEach(function(k,i){var b=document.createElement('button');b.textContent=k[0].toUpperCase()+k.slice(1);if(!i)b.className='on';b.onclick=function(){$$('button',f).forEach(function(x){x.classList.remove('on')});b.classList.add('on');cards.forEach(function(c){c.classList.toggle('hide',k!=='all'&&c.dataset.k!==k)})};f.appendChild(b)});prod.after(f)}
$$('.container h2,.card-group').forEach(function(e){e.classList.add('rv')});
var io=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target)}})},{threshold:.1});
$$('.rv').forEach(function(e){io.observe(e)});
$$('footer .btn').forEach(function(b){b.onclick=function(e){e.preventDefault();var i=$('input',b.parentNode)||$('footer input');say(i&&/@/.test(i.value)?'Subscribed ✓':'Please enter a valid email')}});
})();
