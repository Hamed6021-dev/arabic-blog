document.addEventListener('DOMContentLoaded', () => {
    // --- تعريف المتغيرات والعناصر الأساسية (نفس السابق) ---
    const postModal = document.getElementById('post-modal');
    const adminPostForm = document.getElementById('admin-post-form');
    const postsList = document.getElementById('posts-list');
    const postsCountEl = document.getElementById('posts-count');
    const lastUpdateEl = document.getElementById('last-update');
    const modalTitle = document.getElementById('modal-title');
    const postIdInput = document.getElementById('post-id');

    // --- **جديد**: تهيئة محرر النصوص TinyMCE ---
    tinymce.init({
        selector: '#admin-content', // استهداف حقل المحتوى
        plugins: 'advlist autolink lists link image charmap print preview anchor searchreplace visualblocks code fullscreen insertdatetime media table paste code help wordcount',
        toolbar: 'undo redo | formatselect | bold italic backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | image link media | code | help',
        directionality: 'rtl', // دعم اللغة العربية
        language: 'ar',       // واجهة المحرر باللغة العربية
        content_style: 'body { font-family: "Noto Kufi Arabic", sans-serif; font-size:14px }'
    });

    // --- دوال getPosts و savePosts (تبقى كما هي) ---
    function getPosts() {
        const posts = localStorage.getItem('myArabicBlogPosts');
        return posts ? JSON.parse(posts) : [];
    }
    
    // --- تعديل بسيط على savePosts ---
    function savePosts(posts) {
        localStorage.setItem('myArabicBlogPosts', JSON.stringify(posts));
        // لا نحتاج renderPosts هنا، سيتم استدعاؤها بعد الحفظ مباشرة
    }
    
    // --- دالة renderPosts (تبقى كما هي) ---
    function renderPosts() {
        const posts = getPosts();
        postsList.innerHTML = '';
        if (posts.length === 0) {
            postsList.innerHTML = '<p>لا توجد مقالات. حاول إضافة مقال جديد!</p>';
        } else {
            posts.forEach(post => {
                const postElement = document.createElement('div');
                postElement.className = 'post-item';
                postElement.innerHTML = `
                    <div class="post-item-header">
                        <h3>${post.title}</h3>
                        <span>${post.date}</span>
                    </div>
                    <p>${post.summary}</p>
                    <div class="post-item-actions">
                        <button class="btn-secondary" onclick="showEditPost('${post.id}')">تعديل</button>
                        <button class="btn-danger" onclick="deletePost('${post.id}')">حذف</button>
                    </div>
                `;
                postsList.appendChild(postElement);
            });
        }
        postsCountEl.textContent = posts.length;
        lastUpdateEl.textContent = new Date().toLocaleString('ar-SA');
    }

    // --- دوال Modal (مع تعديل بسيط لـ showEditPost) ---
    window.showAddPost = function() {
        adminPostForm.reset();
        tinymce.get('admin-content').setContent(''); // تفريغ المحرر
        postIdInput.value = '';
        modalTitle.textContent = 'إضافة مقال جديد';
        postModal.style.display = 'block';
    }

    window.closeModal = function() {
        postModal.style.display = 'none';
    }

    window.showEditPost = function(id) {
        const posts = getPosts();
        const postToEdit = posts.find(p => p.id === id);
        if (!postToEdit) return;

        modalTitle.textContent = 'تعديل المقال';
        postIdInput.value = postToEdit.id;
        document.getElementById('admin-title').value = postToEdit.title;
        document.getElementById('admin-summary').value = postToEdit.summary;
        // **تعديل**: تعيين المحتوى في المحرر
        tinymce.get('admin-content').setContent(postToEdit.content);
        document.getElementById('admin-date').value = postToEdit.date;
        postModal.style.display = 'block';
    }

    // --- دالة التعامل مع الفورم (مع تعديل) ---
    adminPostForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = postIdInput.value;
        const posts = getPosts();
        
        const postData = {
            title: document.getElementById('admin-title').value,
            summary: document.getElementById('admin-summary').value,
            // **تعديل**: جلب المحتوى من المحرر
            content: tinymce.get('admin-content').getContent(),
            date: document.getElementById('admin-date').value
        };

        if (id) {
            const postIndex = posts.findIndex(p => p.id === id);
            posts[postIndex] = { ...postData, id: id };
        } else {
            postData.id = 'post_' + Date.now();
            posts.unshift(postData); // نستخدم unshift لإضافة المقال الجديد في بداية القائمة
        }
        
        savePosts(posts);
        renderPosts(); // نعيد العرض هنا
        closeModal();
    });
    
    // --- دوال الحذف والتصدير والاستيراد والخروج (تبقى كما هي) ---
    window.deletePost = function(id) {
        if (confirm('هل أنت متأكد من أنك تريد حذف هذا المقال؟')) {
            let posts = getPosts();
            posts = posts.filter(p => p.id !== id);
            savePosts(posts);
            renderPosts();
        }
    }

    window.exportPosts = function() {
        //... الكود نفسه بدون تغيير
        const posts = getPosts();
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(posts, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "my_blog_posts.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        alert('تم تصدير المقالات بنجاح!');
    }

    window.importPosts = function() {
        //... الكود نفسه بدون تغيير
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = e => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.readAsText(file, 'UTF-8');
            reader.onload = readerEvent => {
                try {
                    const content = readerEvent.target.result;
                    const importedPosts = JSON.parse(content);
                    if (Array.isArray(importedPosts)) {
                         if (confirm('سيتم استبدال المقالات الحالية بالمقالات الموجودة في الملف. هل تريد المتابعة؟')) {
                            savePosts(importedPosts);
                            renderPosts();
                            alert('تم استيراد المقالات بنجاح!');
                         }
                    } else {
                        alert('صيغة الملف غير صحيحة.');
                    }
                } catch (err) {
                    alert('حدث خطأ أثناء قراءة الملف.');
                }
            }
        }
        input.click();
    }

    window.logout = function() {
        alert('تم تسجيل الخروج بنجاح!');
        window.location.href = 'index.html';
    }

    // --- التشغيل الأولي ---
    renderPosts();
});
