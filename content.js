// ============================= inject websocket code ============================
var s = document.createElement("script");
s.src = chrome.extension.getURL("./inject_websocket.js");

// Sau khi thêm vào DOM và chạy xong code thì tự xóa dấu vết
s.onload = function () {
  this.parentNode.removeChild(this);
};

// Bắt đầu thêm vào DOM
let doc = document.body || document.documentElement || document.head;
doc.appendChild(s);

// ========================== Utils ==========================
// Inject extension id: https://stackoverflow.com/a/34414568
var extIdScript = document.createElement("script");
extIdScript.textContent =
  "const rvdfmExtensionId = " + JSON.stringify(chrome.runtime.id);
doc.appendChild(extIdScript);
extIdScript.parentNode.removeChild(extIdScript);

// Custom event for communication between content.js & background.js: https://stackoverflow.com/a/25847017
window.addEventListener(
  "rvdfmPassToBackground",
  function (evt) {
    chrome.runtime.sendMessage(evt.detail);
  },
  false
);

// =========================== Notification ===============================
// https://dev.to/paulasantamaria/chrome-extensions-making-changes-to-a-web-page-1n5f
// Notification body.
const notification = document.createElement("div");
notification.className = "rvdfm-notification";

// Notification icon.
const icon32 = document.createElement("img");
icon32.src = chrome.runtime.getURL("icons/icon32.png");
notification.appendChild(icon32);

// Notification text.
const notificationText = document.createElement("p");
notification.appendChild(notificationText);

// Add to current page.
doc.appendChild(notification);

// Show notification after 5 seconds
setTimeout(() => {
  notificationText.innerHTML =
    "TRIDSN - Xem tin nhắn bị gỡ trên fb <b>ĐANG BẬT</b>";
  notification.style.bottom = "30px";

  setTimeout(function () {
    notification.style.bottom = "-300px";
  }, 5000);
}, 5000);

// =========================== Saved Messages Counter ===========================
const savedCounter = document.createElement("div");
savedCounter.className = "rvdfm-saved-counter";

// Make the Counter element draggable:
dragElement(savedCounter);

// RVDFM icon.
const icon16 = document.createElement("img");
icon16.src = chrome.runtime.getURL("icons/icon32.png");
savedCounter.appendChild(icon16);

const container = document.createElement("div");

// Counter text.
const counterText = document.createElement("p");
counterText.innerHTML = "TRIDSN xin chào";
container.appendChild(counterText);

// =================== Buttons =========================
// Clear all saved msg btn
const btnsContainer = document.createElement("div");

const clearAllSavedMsg = document.createElement("button");
clearAllSavedMsg.innerHTML = "Xóa tất cả";
clearAllSavedMsg.title = "Xóa những tin nhắn đã lưu bởi TRIDSN";
clearAllSavedMsg.onclick = () => {
  alert(
    `Chức năng Xóa tất cả TIN NHẮN ĐÃ LƯU chưa hoàn thành!\nBạn vui lòng bấm F12 vào console gõ câu lệnh rvdfm_clear() và Enter để xóa nhé.`
  );
  // BUG: không thể truy cập rvdfm_all_msgs hay localStorage.rvdfm_all_msgs ?????
  // const count = JSON.parse(localStorage.rvdfm_all_msgs)?.length;
  // rvdfm_all_msgs = [];
  // localStorage.removeItem("rvdfm_all_msgs");
  // counterText.innerHTML = `Đã xóa ${count} tin nhắn khỏi bộ nhớ RVDFM.`;
};
btnsContainer.appendChild(clearAllSavedMsg);

// Show all saved msgs
const showAllSavedMsgBtn = document.createElement("button");
showAllSavedMsgBtn.className = "green";
showAllSavedMsgBtn.innerHTML = "Xem tất cả";
showAllSavedMsgBtn.title = "Xem tất cả tin nhắn được lưu bởi TRIDSN";
showAllSavedMsgBtn.onclick = () => {
  alert(
    `Chức năng Xem tất cả TIN NHẮN ĐÃ LƯU chưa hoàn thành!\nBạn vui lòng bấm F12 vào console gõ câu lệnh rvdfm_all_msgs và Enter để xem nhé.`
  );
};
btnsContainer.appendChild(showAllSavedMsgBtn);
container.appendChild(btnsContainer);

// ========================= DELETED MSGS ===============================
// Tin nhắn thu hồi
const deletedMes = document.createElement("div");
deletedMes.className = "deleted-msg";
container.appendChild(deletedMes);

// Clear deleted msg button
const clearDeletedMsgBtn = document.createElement("button");
clearDeletedMsgBtn.innerHTML = "Xóa";
clearDeletedMsgBtn.title = "Xóa những tin nhắn thu hồi trong khung này";
clearDeletedMsgBtn.onclick = () => {
  deletedMes.innerHTML = "";
  clearDeletedMsgBtn.style.display = "none";
};
container.appendChild(clearDeletedMsgBtn);

savedCounter.appendChild(container);

// Add to current page.
doc.appendChild(savedCounter);

// ================================= EVENTS ============================
const getNow = () => new Date().toLocaleTimeString();

// Show counter
window.addEventListener(
  "rvdfmShowCounter",
  function (evt) {
    const { count, newLength } = evt.detail;
    if (!count && !newLength) {
      counterText.innerText = `TRIDSN xin chào`;
    } else if (newLength) {
      counterText.innerText = `RVDFM Đã lưu thêm được ${count} tin nhắn (${getNow()}). (tổng: ${newLength})`;
      clearAllSavedMsg.style.display = "inline-block";
      showAllSavedMsgBtn.style.display = "inline-block";
    } else {
      counterText.innerText = `Đã xóa ${count} tin nhắn khỏi bộ nhớ RVDFM`;
      clearAllSavedMsg.style.display = "none";
      showAllSavedMsgBtn.style.display = "none";
    }
  },
  false
);

// Show deleted msg
window.addEventListener(
  "rvdfmDeletedMsg",
  function (evt) {
    const msgs = evt.detail;

    for (let msg of msgs) {
      let str = `<br/>Tin nhắn thu hồi lúc (${getNow()}):<br/>(${
        msg?.type?.toLowerCase() || "không rõ"
      }): `;

      switch (msg.type) {
        case "Chữ":
          let preventXSS = document.createElement("span");
          preventXSS.innerText = msg.content;
          deletedMes.insertBefore(preventXSS, deletedMes.firstChild);
          break;
        case "Hình ảnh":
        case "Nhãn dán":
          str += `
          <div>
            <a href="${msg.content}" target="_blank">Mở trong tab mới</a> <br/>
            <img src="${msg.content}" />
          </div>`;
          break;
        case "GIF":
        case "Video":
          str += `
          <div>
            <a href="${msg.content}" target="_blank">Mở trong tab mới</a> <br/>
            <video controls src="${msg.content}" />
          </div>`;
          break;
        case "Âm thanh":
          str += `
          <div>
            <a href="${msg.content}" target="_blank">Mở trong tab mới</a> <br/>
            <audio controls src="${msg.content}">
                Your browser does not support the <code>audio</code> element.
            </audio>
          <div>`;
          break;
        case "Đính kèm":
        case "Chia sẻ":
          str += `<a href="${msg.content}" target="_blank">Mở trong tab mới</a> <br/>`;
          break;
        default:
          str += "(RVDFM Không có dữ liệu cho tin nhắn này)";
      }

      // append to firstc
      const old = deletedMes.innerHTML;
      deletedMes.innerHTML = str + old;
    }

    deletedMes.insertBefore(
      document.createElement("hr"),
      deletedMes.firstChild
    );
    clearDeletedMsgBtn.style.display = "flex";
  },
  false
);

// ========================= Dragable div ===============================
// https://www.w3schools.com/howto/howto_js_draggable.asp
function dragElement(elmnt) {
  var pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0;
  if (document.getElementById(elmnt.id + "header")) {
    // if present, the header is where you move the DIV from:
    document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
  } else {
    // otherwise, move the DIV from anywhere inside the DIV:
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.screenX;
    pos4 = e.screenY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.screenX;
    pos2 = pos4 - e.screenY;
    pos3 = e.screenX;
    pos4 = e.screenY;
    // set the element's new position:
    elmnt.style.top = elmnt.offsetTop - pos2 + "px";
    elmnt.style.left = elmnt.offsetLeft - pos1 + "px";
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}
