const HOST = window.location.hostname || "127.0.0.1";
const BASE_URL = `http://${HOST}:8000`;

let allFiles = [];

async function loadWallet() {
  const user_id = localStorage.getItem("user_id");
  if (!user_id) return;

  loadProfile(user_id);
  
  const container = document.getElementById("walletList");
  if (container) {
    container.innerHTML = `
      <div class="loader-container">
        <div class="rolling-cat">🐱</div>
        <p style="color: #5f6368; margin-top: 1rem;">Rolling through your files...</p>
      </div>
    `;
  }

  try {
    const res = await fetch(`${BASE_URL}/wallet/${user_id}`);
    const data = await res.json();
    allFiles = data.wallet_files || [];
    renderFiles(allFiles);
    
    // For dashboard, show only recent 4
    const recentContainer = document.getElementById("recentUploads");
    if (recentContainer) {
      renderRecent(allFiles.slice(0, 4));
    }
  } catch (err) {
    console.error(err);
    if (container) container.innerHTML = "Error loading files.";
  }
}

function renderFiles(files) {
  const container = document.getElementById("walletList");
  if (!container) return;
  container.innerHTML = "";

  if (files.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 4rem 2rem; background: #f8f9fa; border-radius: 16px; border: 2px dashed #e0e0e0;">
        <i data-lucide="cloud-off" style="width: 48px; height: 48px; color: #bdc1c6; margin-bottom: 1rem;"></i>
        <h3 style="margin: 0; color: #3c4043; font-weight: 500;">No files in your Drive</h3>
        <p style="color: #5f6368; margin: 10px 0 20px 0;">Start by uploading your first document or asset.</p>
        <button class="primary-btn" style="width: auto; padding: 12px 30px;" onclick="document.getElementById('walletFile').click()">
          <i data-lucide="upload"></i> Upload Now
        </button>
      </div>`;
    if (window.lucide) lucide.createIcons();
    return;
  }

  files.forEach(file => {
    container.innerHTML += `
      <div class="glass-card" style="margin: 0; padding: 12px; display: flex; flex-direction: column; justify-content: space-between; background: #fff; border: 1px solid #e0e0e0; box-shadow: none; position: relative;">
        <div style="position: absolute; top: 10px; right: 10px; color: #34a853;" title="Available Offline">
          <i data-lucide="check-circle" style="width: 14px; height: 14px;"></i>
        </div>
        <div style="text-align: center; margin-bottom: 10px;">
          <div style="background: #f8f9fa; border-radius: 4px; padding: 20px; margin-bottom: 10px; display: flex; justify-content: center;">
            <i data-lucide="file-text" style="color: #4285F4; width: 40px; height: 40px;"></i>
          </div>
          <div style="font-weight: 500; font-size: 0.85rem; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; color: #3c4043;">${file.file_name}</div>
        </div>
        <div style="display: flex; gap: 4px;">
          <button class="primary-btn" style="flex: 1; padding: 6px; font-size: 0.75rem; background: #f8f9fa; color: #1a73e8; border: 1px solid #dadce0;" onclick="openLivePreview('${file.preview}', '${file.file_name}')">
            View
          </button>
          <button class="primary-btn" style="padding: 6px; background: #fff; color: #5f6368; border: 1px solid #dadce0;" onclick="deleteWalletFile('${file.id}')">
            <i data-lucide="trash-2" style="width: 14px;"></i>
          </button>
        </div>
      </div>
    `;
  });

  if (window.lucide) lucide.createIcons();
}

function renderRecent(files) {
  const container = document.getElementById("recentUploads");
  if (!container) return;
  container.innerHTML = "";
  files.forEach(file => {
    container.innerHTML += `
      <div class="glass-card" style="margin: 0; padding: 10px; background: #fff; border: 1px solid #e0e0e0; box-shadow: none; display: flex; align-items: center; gap: 10px;">
        <i data-lucide="file-text" style="color: #4285F4; width: 24px;"></i>
        <div style="font-size: 0.8rem; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${file.file_name}</div>
      </div>
    `;
  });
  if (window.lucide) lucide.createIcons();
}

function searchFiles(query) {
  const filtered = allFiles.filter(f => f.file_name.toLowerCase().includes(query.toLowerCase()));
  renderFiles(filtered);
}

async function uploadToWallet(input) {
  const user_id = localStorage.getItem("user_id");
  if (!input.files[0] || !user_id) return;
  const formData = new FormData();
  formData.append("user_id", user_id);
  formData.append("file", input.files[0]);
  try {
    const res = await fetch(`${BASE_URL}/wallet/upload`, { method: "POST", body: formData });
    if (res.ok) {
      alert("Asset uploaded to Drive ✅");
      loadWallet();
      input.value = "";
    } else {
      alert("Upload failed ❌");
    }
  } catch (err) {
    alert("Server error ❌");
  }
}

async function loadProfile(user_id) {
  try {
    const res = await fetch(`${BASE_URL}/auth/profile/${user_id}`);
    const data = await res.json();
    const creditEl = document.getElementById("userCredits") || document.getElementById("totalCredits");
    if (creditEl) creditEl.innerText = `${data.credits || 0} C`;
  } catch (err) {}
}

function openLivePreview(url, title) {
  let previewUrl = url;
  if (!url.includes('mode=preview')) previewUrl += (url.includes('?') ? '&' : '?') + 'mode=preview';
  document.getElementById('previewTitle').innerText = title;
  document.getElementById('previewFrame').src = previewUrl;
  document.getElementById('previewModal').style.display = 'flex';
}

function closeLivePreview() {
  document.getElementById('previewModal').style.display = 'none';
  document.getElementById('previewFrame').src = '';
}

async function deleteWalletFile(id) {
  if (!confirm("Delete this file?")) return;
  await fetch(`${BASE_URL}/wallet/delete/${id}`, { method: "DELETE" });
  loadWallet();
}

document.addEventListener('DOMContentLoaded', loadWallet);