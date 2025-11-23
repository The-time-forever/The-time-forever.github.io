
<!-- Canvas 背景：不影响可访问性 -->
<canvas id="bg-canvas" aria-hidden="true"></canvas>
<style>
	/* Canvas 放到页面最底层，不接收鼠标事件 */
	#bg-canvas{
		position:fixed;
		inset:0;
		width:100%;
		height:100%;
		z-index:-1;
		display:block;
		background:#000000;
		pointer-events:none;
	}
	/* 页面内容保持可见且在 canvas 之上 */
	body, main, .content {
		background: transparent !important;
	}
</style>

# 文章列表

这里以后是我的博客文章目录。

- [第一篇文章](my-first-post.md)

<p style="font-size:0.9rem;color:#bbb">提示：鼠标移动会产生拖尾并影响周围粒子；按住 <strong>Alt</strong> 可切换吸引（Alt）/排斥（默认）效果。</p>

<script src="/assets/js/space-particles.js" defer></script>
