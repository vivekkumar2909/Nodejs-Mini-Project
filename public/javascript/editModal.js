function openEditModal(postId, content) {
    const modal = document.getElementById("editModal");
    const textarea = document.getElementById("editContent");
    const form = document.getElementById("editForm");

    modal.classList.remove("hidden");
    textarea.value = content;
    form.action = "/edit/" + postId;
}

function closeEditModal() {
    document.getElementById("editModal").classList.add("hidden");
}
