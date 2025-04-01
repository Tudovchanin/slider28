



class Slider {
	// Конструктор класса Slider, принимает объект mediaQueries
	constructor(mediaQueries) {
		this.mediaQueries = mediaQueries;  // Медиа-запросы для определения количества видимых слайдов
	}


	// Метод инициализации слайдера, принимает объект с параметрами
	initSlider({
		btnNext = null,
		btnPrev = null,
		slider, item,
		itemLength }) {
		this.flagDragDropMouse = false; // Флаг dragDrop для desktop
		this.flagDragDropTouch = false; // Флаг dragDrop для touch устройств


		this.windowWidth = document.documentElement.clientWidth;  // Ширина окна

		this.elemItem = item;  // Один элемент слайдера
		this.elemBtnNext = btnNext;  // Кнопка для перехода к следующему слайду
		this.elemBtnPrev = btnPrev;  // Кнопка для перехода к предыдущему слайду
		this.elemSlider = slider;  // Сам слайдер


		this.stepNumber = 1; // Текущий шаг
		this.position = 0;  // Начальная позиция слайдера
		this.sliderLength = itemLength;  // Количество элементов item слайдера
		this.visibleSlides = this.getVisibleSlidesMediaQueries(this.mediaQueries);  // Количество видимых слайдов
		this.distance = this.updateWidthItem();  // Ширина одного элемента слайдера
		this.setTotalSteps();

		this.onResize = this.handleResize.bind(this); // обработчик события resize
		this.onDOMLoaded = this.handleDOMLoaded.bind(this); // обработчик события DOMContentLoaded


		// Установка обработчика события, когда документ полностью загружен
		document.addEventListener('DOMContentLoaded', this.onDOMLoaded);

		// Обработчик события изменения размера окна
		window.addEventListener('resize', this.onResize);


		// Установка обработчиков событий для кнопок вперед / назад
		if (this.elemBtnNext && this.elemBtnPrev) {

			this.onclickNext = this.handleClickNext.bind(this);
			this.onclickPrev = this.handleClickPrev.bind(this);


			this.elemBtnNext.addEventListener('click', this.onclickNext);
			this.elemBtnPrev.addEventListener('click', this.onclickPrev);
		}
	}

	dispatchSlideChangeEvent() {
		const event = new CustomEvent('slideChanged', {
			bubbles: true,
			detail: {
				currentStep: this.stepNumber,
				totalSteps: this.totalSteps,
			},
		});

		this.elemSlider.dispatchEvent(event);
	}

	initStepsCallback(callBack) {
		this.callBackSteps = callBack;
	}
	
	initResizeCallback (callback) {
		this.callBackResize = callback;
	}


	// Удаление событий
	removeAllListener() {

		document.removeEventListener('DOMContentLoaded', this.onDOMLoaded);
		window.removeEventListener('resize', this.onResize);

		if (this.elemBtnNext && this.elemBtnPrev) {
			this.elemBtnNext.removeEventListener('click', this.onclickNext);
			this.elemBtnPrev.removeEventListener('click', this.onclickPrev);
		}

		if (this.flagDragDropMouse) {

			// Обработчики событий для мыши
			this.elemSlider.removeEventListener('mousedown', this.onmousedown);

			this.elemSlider.removeEventListener('mousemove', this.onmousemove);

			document.removeEventListener('mouseup', this.onmouseup);
		}

		if (this.flagDragDropTouch) {

			this.elemSlider.removeEventListener('touchstart', this.ontouchstart);
			this.elemSlider.removeEventListener('touchmove', this.ontouchmove);
			document.removeEventListener('touchend', this.ontouchend);

		}
	}

	handleClickNext() {
		this.moveNext();
		this.updateButtonStates();
		this.setSlideStep();
	}

	handleClickPrev() {
		this.movePrev();
		this.updateButtonStates();
		this.setSlideStep();
	}

	handleResize() {

		let newWindowWidth = document.documentElement.clientWidth;
		if (newWindowWidth === this.windowWidth) return;
		this.resetSlider();
		this.distance = this.updateWidthItem();
		this.visibleSlides = this.getVisibleSlidesMediaQueries(this.mediaQueries);
		this.updateButtonStates();
		this.setTotalSteps();
		this.windowWidth = newWindowWidth;
		this.dispatchSlideChangeEvent();
		this.callBackSteps(this.stepNumber, this.totalSteps);
		this.callBackResize();
	}

	handleDOMLoaded() {
		this.updateButtonStates();
		this.setTotalSteps();
		this.dispatchSlideChangeEvent();
		this.callBackSteps(this.stepNumber, this.totalSteps);
	}


	initDragDrop(desktop = false) {
		this.flagDragDropTouch = true;
		this.isDragging = false;  // Флаг перетаскивания
		this.touchStart = 0;  // Начальная точка касания/клика
		this.touchEnd = 0;  // Конечная точка касания/клика
		this.touchMove = 0;  // Текущая позиция перетаскивания
		this.ontouchstart = this.handleStart.bind(this);
		this.ontouchmove = this.handleMove.bind(this);
		this.ontouchend = this.handleEnd.bind(this);

		// Обработчик события начала касания
		this.elemSlider.addEventListener('touchstart', this.ontouchstart, { passive: false });

		// Обработчик события перемещения касания
		this.elemSlider.addEventListener('touchmove', this.ontouchmove, { passive: false });

		// Обработчик события завершения касания
		document.addEventListener('touchend', this.ontouchend);

		if (!desktop) return;
		this.flagDragDropMouse = true;

		this.onmousedown = this.handleStart.bind(this);
		this.onmousemove = this.handleMove.bind(this);
		this.onmouseup = this.handleEnd.bind(this);

		// Обработчики событий для мыши
		this.elemSlider.addEventListener('mousedown', this.onmousedown, { passive: false });

		this.elemSlider.addEventListener('mousemove', this.onmousemove, { passive: false });

		document.addEventListener('mouseup', this.onmouseup);
	}

	handleStart(e) {
		e.preventDefault();
		const clientX = e.touches ? e.touches[0].clientX : e.clientX;

		this.startDragDrop(clientX);

	}

	handleMove(e) {
		if (!this.isDragging) return;
		// e.preventDefault();
		const clientX = e.touches ? e.touches[0].clientX : e.clientX;
		this.moveDragDrop(clientX);
	}

	handleEnd(e) {
		if (!this.isDragging) return;
		// e.preventDefault();
		this.endDragDrop();

	}

	// Метод начала перетаскивания
	startDragDrop(value) {
		this.isDragging = true;
		this.touchStart = value;
	}

	// Метод перемещения при перетаскивании
	moveDragDrop(value) {
		this.touchMove = value - this.touchStart + this.position;
		this.animateSlider(this.elemSlider, this.touchMove);
		this.touchEnd = value;
	}

	// Метод завершения перетаскивания
	endDragDrop() {
		this.isDragging = false;
		this.position = this.touchMove;

		setTimeout(() => {
			// Если позиция больше 0, вернуться к началу
			if (this.position > 0) {
				this.animateSlider(this.elemSlider, 0);
				this.position = 0;

				this.setSlideStep();

				// Если позиция меньше конца слайдера, вернуться к концу
			} else if (this.position < this.sliderEnd()) {
				this.animateSlider(this.elemSlider, this.sliderEnd());
				this.position = this.sliderEnd();
				this.setSlideStep();
				// Если перетаскивание было значительным, перейти на следующий слайд
			} else if (this.touchEnd - this.touchStart < -20) {
				this.position = this.distance * (Math.floor(this.position / this.distance));

				this.setSlideStep();
				this.animateSlider(this.elemSlider, this.position);

				// Если перетаскивание было значительным, перейти на предыдущий слайд
			} else if (this.touchEnd - this.touchStart > 20) {
				this.position = this.distance * (Math.ceil(this.position / this.distance));

				this.setSlideStep();
				this.animateSlider(this.elemSlider, this.position);
				// Иначе, оставить на текущем слайде

			} else {
				this.position = this.distance * (Math.round(this.position / this.distance));
				this.animateSlider(this.elemSlider, this.position);
			}
			this.updateButtonStates();
			this.dispatchSlideChangeEvent();
		}, 100);
	}

	// Метод вычисления конца слайдера
	sliderEnd() {
		return -(this.sliderLength * this.distance - this.visibleSlides * this.distance);
	}

	// Метод установки общего количества шагов
	setTotalSteps() {
		this.totalSteps = this.sliderLength - this.visibleSlides + 1;
	}

	// Метод установки текущего шага
	setSlideStep() {
		if (this.position > 0) return;
		const valueStep = Math.abs(this.position / this.distance) + 1;
		this.stepNumber = valueStep;

		this.callBackSteps(this.stepNumber, this.totalSteps);
		this.dispatchSlideChangeEvent();
	}

	// Метод получения количества видимых слайдов по медиа-запросам
	getVisibleSlidesMediaQueries(media) {
		for (let key in media) {
			if (media[key].matches) {
				return parseInt(key);
			}
		}
	}

	// Метод обновления ширины элемента
	updateWidthItem() {
		return this.elemItem.offsetWidth;
	}

	//Метод проверки кнопок для отключения или включения
	updateButtonStates() {
		if (this.elemBtnNext) {
			this.elemBtnNext.disabled = this.position <= this.sliderEnd();
		}
		if (this.elemBtnPrev) {
			this.elemBtnPrev.disabled = this.position >= 0;
		}
	}

	// Метод перехода к следующему слайду
	moveNext() {
		const valueEnd = this.visibleSlides * this.distance - this.distance * this.sliderLength;
		if (this.position <= valueEnd) return;

		this.position = this.position - this.distance;
		this.animateSlider(this.elemSlider, this.position);
	}

	// Метод перехода к предыдущему слайду
	movePrev() {

		if (this.position === 0) return;

		this.position = this.position + this.distance;
		this.animateSlider(this.elemSlider, this.position);
	}

	// Метод анимации слайдера
	animateSlider(elem, valueTranslate) {
		requestAnimationFrame(() => {
			elem.style.transform = `translateX(${valueTranslate}px)`;
		});
	}

	// Метод сброса слайдера
	resetSlider() {
		this.stepNumber = 1;
		this.position = 0;
		this.animateSlider(this.elemSlider, this.position);
	}
}



// Объект медиа-запросов, в ключах прописываем сколько видно слайдов, в css устанавливаем какое количество слайдов  видно,  например:
//  .item {
// 	flex-shrink: 0;
// 	flex-grow: 0;
// 	width: 25%; (25% это 4 слайда , 50% = 2 , 33% = 3, и тд)
// 	padding: 0 14px;
// } для правильной работы счетчика шагов нужно прописать ключ для каждого изменения кол-ва слайдов и указать разрешение при котором кол-во видимых слайдов меняется(медиа запросы в css)
const media = {
	1: window.matchMedia('(max-width: 500px)'),
	2: window.matchMedia('(max-width: 767px)'),
	3: window.matchMedia('(max-width: 1024px)'),
	5: window.matchMedia('(min-width: 1025px)'),
};

// Можно создать много слайдеров, для этого добавляем container-slider с его дочерними элементами в html
document.querySelectorAll('.container-slider').forEach((elem, index) => {
	// Объект с элементами слайдера, если кнопки ненужны не указываем их в объекте
	const $sliderAllElem = {
		btnNext: document.querySelectorAll('.btn-next-slide')[index],
		btnPrev: document.querySelectorAll('.btn-prev-slide')[index],
		slider: elem.querySelector('.slider'),
		itemLength: elem.querySelectorAll('.item').length,
		item: elem.querySelector('.item'),
	}
	const $containerIconsSteps = elem.querySelector('.container-icons-steps'); // контейнер с иконками шагов
	const $totalSteps = elem.querySelector('.total-steps'); // элемент общего кол-ва шагов
	const $stepSlide = elem.querySelector('.step-slide'); // элемент текущего шага



	const sliderObj = new Slider(media);
	sliderObj.initSlider($sliderAllElem);//инициализация слайдера
	sliderObj.initDragDrop('desktop');//инициализация drag'n drop не обязательна, если для desktop ненужно, то вызываем метод без аргумента
	sliderObj.initStepsCallback(callbackSteps);
	sliderObj.initResizeCallback(callbackResizeWidth);
	

	
	if ($containerIconsSteps && sliderObj.totalSteps) {
		$containerIconsSteps.append(initIconSteps(sliderObj.totalSteps, 'icon-step'))
	}

	// если нужно слайдер создает событие при изменение 
	
	elem.addEventListener('slideChanged', (e) => {
		console.log(`Событие: текущий шаг ${e.detail.currentStep}, всего шагов ${e.detail.totalSteps}`);
	});

	// callback вызывается при изменении размеров экрана
	function callbackResizeWidth() {
		
		if($containerIconsSteps && $containerIconsSteps.childNodes.length > 0) {
			$containerIconsSteps.replaceChildren();
			$containerIconsSteps.append(initIconSteps(sliderObj.totalSteps, 'icon-step'));
			showStepIcon(1);
		}
		
		
		
	}
	// callback вызывается при изменении размеров экрана и при изменение позиции слайдера
	function callbackSteps(step, totalSteps) {
		if ($containerIconsSteps) {
			showStepIcon(step);
		}
		showStepText(step, totalSteps);
	}
	// создании иконок шагов
	function initIconSteps(length, className = null) {
		const fragmentIcons = document.createDocumentFragment();

		for (let index = 0; index < length; index++) {
			const icon = document.createElement('div');
			className && icon.classList.add(className);
			fragmentIcons.appendChild(icon);
		}
		return fragmentIcons;
	}
	// переключение active  иконки шагов
	function showStepIcon(step) {
		const $allIconsSteps = $containerIconsSteps.querySelectorAll('.icon-step')
	
		$allIconsSteps.forEach(el => el.classList.remove('icon-active'));
		$allIconsSteps[step - 1].classList.add('icon-active')
	}
	// показывает текущий шаг и всего количество шагов 
	function showStepText(step, totalSteps) {
		$stepSlide.textContent = step;
		$totalSteps.textContent = totalSteps;
	}
});