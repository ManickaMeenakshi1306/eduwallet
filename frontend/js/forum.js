const BASE_URL = "http://127.0.0.1:8000";

async function loadForums() {
  try {
    const res = await fetch(`${BASE_URL}/forum/forums`);
    const data = await res.json();
    const container = document.getElementById("forumsContainer");
    if (!container) return;
    container.innerHTML = "";

    if (!data.forums || data.forums.length === 0) {
        container.innerHTML = "<p style='color: gray; grid-column: 1/-1; text-align: center;'>No forums available yet.</p>";
        return;
    }

    data.forums.forEach(forum => {
      container.innerHTML += `
        <div class="glass-card" style="padding: 1.5rem; background: #fff; border: 1px solid #e0e0e0; box-shadow: 0 1px 2px rgba(0,0,0,0.05); border-radius: 12px; transition: transform 0.2s;">
          <div style="display: flex; align-items: flex-start; gap: 15px; margin-bottom: 1rem;">
            <div style="width: 48px; height: 48px; background: #e8f0fe; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #1967d2;">
              <i data-lucide="users"></i>
            </div>
            <div style="flex: 1;">
              <h3 style="margin: 0 0 4px 0; font-size: 1.05rem; font-weight: 600; color: #1a73e8;">${forum.name}</h3>
              <p style="margin: 0; font-size: 0.85rem; color: #5f6368; line-height: 1.4;">${forum.description || "Active community discussion and asset sharing."}</p>
            </div>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 1rem; border-top: 1px solid #f1f3f4;">
            <span style="font-size: 0.75rem; color: #70757a;">248 Members • 12 New Assets</span>
            <button class="primary-btn" style="width: auto; padding: 6px 16px; font-size: 0.85rem; border: 1px solid #dadce0; background: #fff; color: #1a73e8;" onclick="openForum('${forum.id}', '${forum.name}')">
              Explore
            </button>
          </div>
        </div>
      `;
    });
    if (window.lucide) lucide.createIcons();
  } catch (err) {
    console.error(err);
  }
}

function openForum(id, name) {
  localStorage.setItem("forum_id", id);
  window.location = `forum.html?name=${encodeURIComponent(name)}`;
}

function openCreateModal() {
  document.getElementById("createModal").style.display = "flex";
}

function closeCreateModal() {
  document.getElementById("createModal").style.display = "none";
}

async function createForum() {
  const title = document.getElementById("forumName").value;
  const content = document.getElementById("forumDesc").value;
  const user_id = localStorage.getItem("user_id");

  if (!title) return alert("Title required");

  const res = await fetch(`${BASE_URL}/forum/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content, user_id, is_private: false })
  });
  
  if (res.ok) {
    alert("New Community Hub created! ✅");
    closeCreateModal();
    loadForums();
  } else {
    alert("Failed to create hub ❌");
  }
}

document.addEventListener('DOMContentLoaded', loadForums);