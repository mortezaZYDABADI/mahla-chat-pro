// ----------------------
// متغیرها
let users = {}; // کاربران آنلاین
let channels = {}; // کانال‌ها
let currentUser = null;
let emojiCount = 0;
const EMOJI_LIMIT = 6;
let warnings = {};
let mutedUsers = {};
let leaders = { leader: null, assistants: [] };
let coins = {}; // سکه کاربران {userId: count}

// ----------------------
// ثبت نام
function registerUser(){
  const name = document.getElementById("nameInput").value.trim();
  if(!name) return alert("نام را وارد کنید");
  const age = document.getElementById("ageInput").value;
  const gender = document.getElementById("genderInput").value;
  const city = document.getElementById("cityInput").value.trim();

  currentUser = {
    id: Date.now(),
    name, age, gender, city
  };
  users[currentUser.id] = currentUser;
  coins[currentUser.id] = 10; // سکه اولیه

  document.getElementById("register-container").style.display="none";
  document.getElementById("chat-container").style.display="flex";
  updateProfile();
  updateUsersList();
}

// ----------------------
// نمایش کاربران آنلاین
function updateUsersList(){
  const container = document.getElementById("users");
  container.innerHTML = "";
  Object.values(users).forEach(u=>{
    const div = document.createElement("div");
    div.textContent = u.name + (leaders.leader===u.id?" 👑":leaders.assistants.includes(u.id)?" 🗿":"");
    container.appendChild(div);
  });

  // چت خصوصی
  const select = document.getElementById("private-user-select");
  select.innerHTML = '<option value="">انتخاب کاربر</option>';
  Object.values(users).forEach(u=>{
    if(u.id!==currentUser.id) select.innerHTML += `<option value="${u.id}">${u.name}</option>`;
  });
}

// ----------------------
// پروفایل
function updateProfile(){
  document.getElementById("profileName").textContent = currentUser.name;
  document.getElementById("profileCoins").textContent = coins[currentUser.id] || 0;
  const ul = document.getElementById("profileChannels");
  ul.innerHTML="";
  Object.values(channels).forEach(c=>{
    if(c.owner===currentUser.id){
      const li = document.createElement("li");
      li.textContent = c.name + " (" + c.price + " 🪙)";
      ul.appendChild(li);
    }
  });
}

// ----------------------
// ارسال پیام عمومی
function sendMsg(){
  if(mutedUsers[currentUser.id] && mutedUsers[currentUser.id]>Date.now()){
    return alert("شما در حالت سکوت هستید ⏱️");
  }
  const input = document.getElementById("msgInput");
  if(input.value.trim()==="") return;
  addMessage(currentUser.name, input.value);
  input.value="";
  coins[currentUser.id] = (coins[currentUser.id]||0)+1; // جایزه سکه برای چت
  updateProfile();
}

// ----------------------
// ارسال پیام خصوصی
function sendPrivateMsg(){
  const targetId = document.getElementById("private-user-select").value;
  const msg = document.getElementById("privateMsgInput").value.trim();
  if(!targetId || msg==="") return alert("کاربر و پیام را انتخاب کنید");
  addMessage(currentUser.name+" → "+users[targetId].name, msg);
  coins[currentUser.id] = (coins[currentUser.id]||0)+1;
  updateProfile();
  document.getElementById("privateMsgInput").value="";
}

// ----------------------
// اضافه کردن پیام به پنجره
function addMessage(sender, text){
  const container = document.getElementById("messages");
  const div = document.createElement("div");
  div.className="message";
  div.innerHTML=`<span>${sender}: ${text}</span>
  <span>
    <span class="like-btn" onclick="likeMsg(this)">👍</span>
    <span class="dislike-btn" onclick="dislikeMsg(this)">👎</span>
  </span>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

// ----------------------
// لایک و دیسلایک
function likeMsg(el){
  el.style.color="green";
}
function dislikeMsg(el){
  el.style.color="red";
}

// ----------------------
// ایموجی محدود
function sendEmoji(e){
  if(emojiCount>=EMOJI_LIMIT){ alert("محدودیت ایموجی ۶ در دقیقه"); return;}
  addMessage(currentUser.name,e);
  emojiCount++;
  coins[currentUser.id] = (coins[currentUser.id]||0)+1;
  updateProfile();
}
setInterval(()=>{emojiCount=0;},60000);

// ----------------------
// لیدر و معاون
function assignAssistant(){
  const name = prompt("نام کاربر برای معاون:");
  const target = Object.values(users).find(u=>u.name===name);
  if(target){
    leaders.assistants.push(target.id);
    updateUsersList();
    alert(target.name+" اکنون معاون است 🗿");
  }
}
function warnUser(){
  const name = prompt("نام کاربر برای هشدار:");
  const target = Object.values(users).find(u=>u.name===name);
  if(!target) return alert("کاربر یافت نشد");
  warnings[target.id] = (warnings[target.id]||0)+1;
  alert(`${target.name} هشدار ${warnings[target.id]} گرفت ⚠️`);
  if(warnings[target.id]>=3){
    mutedUsers[target.id] = Date.now() + 3*60*1000;
    alert(`${target.name} سکوت شد 3 دقیقه ⏱️`);
    warnings[target.id]=0;
  }
}

// ----------------------
// پنجره شناور و ویدئو کال
function toggleFloating(){ document.getElementById("chat-container").classList.toggle("floating"); }
function startVideoCall(){
  navigator.mediaDevices.getUserMedia({video:true,audio:true})
  .then(stream=>{
    const video = document.createElement("video");
    video.srcObject=stream;
    video.autoplay=true;
    video.width=200;
    document.body.appendChild(video);
  }).catch(e=>{alert("دسترسی به دوربین/میکروفون مشکل دارد");});
}

// ----------------------
// ساخت کانال با سکه
function createChannel(){
  const name = document.getElementById("channelNameInput").value.trim();
  const price = parseInt(document.getElementById("channelPriceInput").value);
  if(!name || !price) return alert("نام و قیمت کانال را وارد کنید");
  if(coins[currentUser.id]<price) return alert("سکه کافی نیست 🪙");

  coins[currentUser.id]-=price; // کم شدن سکه کاربر
  // واریز سکه به مدیر (id=0)
  coins[0] = (coins[0]||0)+price;

  const channelId = Date.now();
  channels[channelId] = {id:channelId,name,price,owner:currentUser.id};
  updateProfile();
  updateChannelsList();
}

function updateChannelsList(){
  const div = document.getElementById("channels");
  div.innerHTML="";
  Object.values(channels).forEach(c=>{
    div.innerHTML += `<div>${c.name} (${c.price} 🪙)</div>`;
  });
}  });
});

// دریافت پیام‌ها
socket.on("message", data => {
  const div = document.createElement("div");
  div.innerHTML = `<b>${data.user.name}:</b> ${data.text}`;
  document.getElementById("messages").appendChild(div);
});

// ارسال پیام
function sendMsg() {
  const input = document.getElementById("msgInput");
  if(input.value.trim() === "") return;
  socket.emit("message", input.value);
  input.value="";
}

// --------------------------
// TODO: توسعه تمام امکانات پیشرفته
// 1. سیستم لیدر و معاون لیدر 👑🗿
// 2. Timeout / Mute / Warn ⏱️
// 3. تغییر فونت، رنگ و تم 🎨 + چک رنگ
// 4. چت خصوصی 🔒
// 5. سیستم گزارش و ویرایش پیام ⚠️
// 6. سیستم رأی گیری تغییر لیدر 🗳️
// 7. پنجره چت شناور 🪟
// 8. ایموجی محدود 😎
// 9. تماس ویدئویی 🎥
// 10. پس‌زمینه متحرک ❤️🔥
// --------------------------
// سیستم لیدر و معاون
let warnings = {}; // ذخیره هشدارها {userId: count}
let mutedUsers = {}; // ذخیره کاربران سکوت شده {userId: timestamp پایان سکوت}

// تعیین لیدر و معاون
function assignAssistant() {
  const targetName = prompt("نام کاربری برای معاون:");
  const target = Object.values(users).find(u=>u.name===targetName);
  if(target){
    leaders.assistants.push(target.id);
    alert(target.name+" اکنون معاون است 🗿");
    socket.emit("updateRoles", leaders);
  }
}

function promoteToLeader() {
  if(currentUser && leaders.assistants.includes(currentUser.id)){
    leaders.leader = currentUser.id;
    alert("شما اکنون لیدر هستید 👑");
    socket.emit("updateRoles", leaders);
  }
}

// هشدار و سکوت
function warnUser() {
  const targetName = prompt("نام کاربری برای هشدار:");
  const target = Object.values(users).find(u=>u.name===targetName);
  if(!target) return alert("کاربر یافت نشد");
  
  warnings[target.id] = (warnings[target.id] || 0)+1;
  alert(`${target.name} هشدار ${warnings[target.id]} گرفت ⚠️`);

  if(warnings[target.id]>=3){
    mutedUsers[target.id] = Date.now() + 3*60*1000; // 3 دقیقه سکوت
    alert(`${target.name} به مدت 3 دقیقه سکوت شد ⏱️`);
    socket.emit("muteUser", {id:target.id, until:mutedUsers[target.id]});
    warnings[target.id] = 0; // ریست هشدارها
  }
}

// هنگام ارسال پیام چک می‌کنیم کاربر سکوت نشده باشه
function sendMsg() {
  if(mutedUsers[currentUser.id] && mutedUsers[currentUser.id]>Date.now()){
    return alert("شما در حالت سکوت هستید ⏱️");
  }
  const input = document.getElementById("msgInput");
  if(input.value.trim() === "") return;
  socket.emit("message", input.value);
  input.value="";
}

// نمایش دکمه‌ها فقط برای لیدر/معاون
function updateControls() {
  const div = document.getElementById("leader-controls");
  if(currentUser && (currentUser.id===leaders.leader || leaders.assistants.includes(currentUser.id))){
    div.style.display = "block";
  } else {
    div.style.display = "none";
  }
}

// هر بار کاربران تغییر کردن، کنترل‌ها رو آپدیت کن
socket.on("users", onlineUsers => {
  users = onlineUsers;
  updateControls();
});
