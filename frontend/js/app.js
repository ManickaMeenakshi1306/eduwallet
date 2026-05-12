const BASE_URL = "http://127.0.0.1:8000";

/* =========================
   GENERAL FILE UPLOAD
========================= */
async function uploadFile() {
  const file = document.getElementById("file").files[0];
  const downloadable = document.getElementById("downloadable").checked;

  if (!file) return alert("Please select a file first");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("is_downloadable", downloadable);

  try {
    const res = await fetch(`${BASE_URL}/upload/`, {
      method: "POST",
      body: formData
    });

    if (res.ok) {
      alert("File uploaded ✅");
    } else {
      alert("Upload failed ❌");
    }
  } catch (err) {
    alert("Server error ❌");
  }
}

/* =========================
   FORUM NOTES
========================= */

/* LOAD NOTES */
async function loadNotes() {
  const forum_id = localStorage.getItem("forum_id");
  if (!forum_id) return;

  const container = document.getElementById("notesContainer");
  if (!container) return;
  
  container.innerHTML = `
    <div class="loader-container">
      <div class="rolling-cat">🐱</div>
      <p style="color: #65676b; margin-top: 1rem; font-size: 0.9rem;">Rolling through assets...</p>
    </div>
  `;

  try {
    const res = await fetch(`${BASE_URL}/forum/forum_notes/${forum_id}`);
    const data = await res.json();
    
    if (!data.notes || data.notes.length === 0) {
      container.innerHTML = `<p style="color: #65676b; text-align: center; margin-top: 2rem;">No assets shared yet.</p>`;
      return;
    }
    
    container.innerHTML = ""; // Clear loader

    data.notes.forEach(note => {
      const uploader = note.uploaded_by || "Unknown User";
      const initial = uploader.charAt(0).toUpperCase();
      const tagsHtml = note.tags ? note.tags.split(',').map(t => `<span class="tag">#${t.trim()}</span>`).join('') : '';

      container.innerHTML += `
        <article class="glass-card" style="margin-bottom: 1.5rem; padding: 1.25rem; background: #fff; border: 1px solid #e0e0e0; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
          <header style="display: flex; align-items: center; gap: 12px; margin-bottom: 1rem;">
            <div class="avatar" style="width: 42px; height: 42px; font-size: 1rem; background: #f0f2f5; color: #1c1e21;">${initial}</div>
            <div style="flex: 1;">
              <h4 style="margin: 0; font-size: 0.9rem; font-weight: 600; color: #1c1e21;">${uploader}</h4>
              <div style="font-size: 0.75rem; color: #65676b;">Shared an asset • 2h ago</div>
            </div>
            <button onclick="editAsset('${note.id}', '${note.description}')" style="background: transparent; border: none; color: #65676b; cursor: pointer;"><i data-lucide="edit-3" style="width: 18px;"></i></button>
            <button style="background: transparent; border: none; color: #65676b; cursor: pointer;"><i data-lucide="more-horizontal"></i></button>
          </header>
          
          <div style="margin-bottom: 1rem;">
            <p style="font-size: 0.95rem; line-height: 1.5; color: #1c1e21; margin-bottom: 0.75rem;">${note.description || "No description provided."}</p>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">${tagsHtml}</div>
          </div>

          <div style="background: #f8f9fa; border-radius: 8px; border: 1px solid #e0e0e0; padding: 12px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 40px; height: 40px; background: #fff; border-radius: 4px; display: flex; align-items: center; justify-content: center; border: 1px solid #ddd;">
                <i data-lucide="file-text" style="color: #4285F4;"></i>
              </div>
              <div style="font-weight: 600; font-size: 0.9rem; color: #1c1e21;">${note.file_name}</div>
            </div>
            <button class="primary-btn" style="width: auto; padding: 6px 16px; font-size: 0.85rem; background: #fff; border: 1px solid #dadce0; color: #1a73e8;" onclick="openLivePreview('${note.preview}', '${note.file_name}')">
              Preview
            </button>
          </div>

          <footer style="display: flex; gap: 1.5rem; border-top: 1px solid #f0f2f5; pt: 0.75rem; margin-top: 1rem;">
            <div class="action-item" onclick="toggleLike(this)" style="color: #65676b; font-weight: 600; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 6px;">
              <i data-lucide="thumbs-up" style="width: 18px;"></i> <span>Like</span>
            </div>
            <div class="action-item" onclick="toggleComment(this)" style="color: #65676b; font-weight: 600; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 6px;">
              <i data-lucide="message-square" style="width: 18px;"></i> <span>Comment</span>
            </div>
            ${note.download ? `
              <div class="action-item" onclick="downloadFile('${note.download}')" style="color: #1a73e8; font-weight: 600; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 6px; margin-left: auto;">
                <i data-lucide="download" style="width: 18px;"></i> Save
              </div>
            ` : ''}
          </footer>
        </article>
      `;
    });

    if (window.lucide) lucide.createIcons();

  } catch (err) {
    console.error("Load Notes Error:", err);
  }
}

/* LIVE PREVIEW */
async function openLivePreview(url, title) {
  addCredits(5); // Reward credits for forum preview (+5c)

  let previewUrl = url;
  if (!url.includes('mode=preview')) {
    previewUrl += (url.includes('?') ? '&' : '?') + 'mode=preview';
  }

  document.getElementById('previewTitle').innerText = title;
  document.getElementById('previewFrame').src = previewUrl;
  document.getElementById('previewModal').style.display = 'flex';
}

function closeLivePreview() {
  document.getElementById('previewModal').style.display = 'none';
  document.getElementById('previewFrame').src = '';
}

/* DOWNLOAD / SAVE */
async function downloadFile(url) {
  if (!url) return;
  addCredits(10); // Reward credits for forum download (+10c)

  let downloadUrl = url;
  if (!url.includes('mode=download')) {
    downloadUrl += (url.includes('?') ? '&' : '?') + 'mode=download';
  }

  if (downloadUrl.startsWith('http')) {
    window.open(downloadUrl, "_blank");
  } else {
    window.open(`${BASE_URL}${downloadUrl}`, "_blank");
  }
}

/* UPLOAD NOTE */
async function uploadNote() {
  const forum_id = localStorage.getItem("forum_id");
  const user_id = localStorage.getItem("user_id");

  const tags = document.getElementById("tags").value;
  const description = document.getElementById("description").value;
  const fileInput = document.getElementById("file");
  const file = fileInput.files[0];
  const downloadable = document.getElementById("downloadable").checked;

  if (!file) return alert("Please select a file to upload");

  const formData = new FormData();
  formData.append("forum_id", forum_id);
  formData.append("user_id", user_id);
  formData.append("tags", tags);
  formData.append("description", description);
  formData.append("is_downloadable", downloadable);
  formData.append("file", file);

  try {
    const res = await fetch(`${BASE_URL}/forum/upload_note`, {
      method: "POST",
      body: formData
    });

    if (res.ok) {
      alert("Note uploaded ✅");
      loadNotes();
      // Clear form
      fileInput.value = "";
      document.getElementById("description").value = "";
      document.getElementById("tags").value = "";
    } else {
      alert("Upload failed ❌");
    }
  } catch (err) {
    alert("Server error ❌");
  }
}

// Smooth Entrance Animation & Simulated Logic
document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll('.glass-card, .stat-card');
  cards.forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
    setTimeout(() => {
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, index * 100);
  });

  // Simulate dynamic stats
  animateValue("totalEarnings", 0, 4250, 2000);
  animateValue("activeTasks", 0, 12, 1500);
  
  // Random AI Match update
  setInterval(() => {
    const match = Math.floor(Math.random() * 5) + 90; // Keep it between 90-95
    const progress = document.querySelector('.circular-progress');
    if (progress) {
      progress.style.setProperty('--percent', match);
      progress.querySelector('.percent-value').innerText = `${match}%`;
    }
  }, 5000);
});

function animateValue(id, start, end, duration) {
  const obj = document.getElementById(id);
  if (!obj) return;
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const val = Math.floor(progress * (end - start) + start);
    if (id === "totalCredits") {
      obj.innerHTML = `${val.toLocaleString()} C`;
    } else {
      obj.innerHTML = val;
    }
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

async function addCredits(amount) {
  const user_id = localStorage.getItem("user_id");
  if (!user_id) return;
  try {
    const res = await fetch(`${BASE_URL}/auth/add_credits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, amount })
    });
    const data = await res.json();
    if (data.success) {
      const creditEl = document.getElementById("totalCredits") || document.getElementById("userCredits") || document.getElementById("settingsCredits");
      if (creditEl) {
        const currentText = creditEl.innerText.replace(/[^0-9]/g, '');
        const current = parseInt(currentText) || 0;
        animateValue(creditEl.id, current, current + parseInt(amount), 1000);
      }
      // Re-fetch profile after a delay to ensure DB consistency
      setTimeout(() => {
        if (window.loadProfile) loadProfile(user_id);
      }, 1500);
    }
  } catch (err) {
    console.error("Credit Reward Error:", err);
  }
}

function toggleLike(el) {
  const span = el.querySelector('span');
  const icon = el.querySelector('i');
  if (span.innerText === 'Like') {
    span.innerText = 'Liked';
    el.style.color = '#1a73e8';
    if (icon) icon.style.fill = '#1a73e8';
  } else {
    span.innerText = 'Like';
    el.style.color = '#65676b';
    if (icon) icon.style.fill = 'none';
  }
}

function toggleComment(el) {
  const comment = prompt("Enter your comment:");
  if (comment) {
    alert("Comment posted live! (Demo)");
  }
}

async function editAsset(id, currentDesc) {
  const newDesc = prompt("Edit description:", currentDesc);
  if (newDesc === null || newDesc === currentDesc) return;
  
  try {
    const res = await fetch(`${BASE_URL}/forum/update_note/${id}?description=${encodeURIComponent(newDesc)}`, {
      method: "PUT"
    });
    if (res.ok) {
      alert("Asset updated! ✅");
      loadNotes();
    }
  } catch (err) {
    alert("Failed to update asset ❌");
  }
}