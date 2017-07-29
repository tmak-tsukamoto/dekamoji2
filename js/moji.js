"use strict";
window.DispLbl = {
	/**
	 * 定数（？）
	 * @type Object
	 */
	constants : {
		fontFamily : "'Hiragino Kaku Gothic Pro', 'ヒラギノ角ゴ Pro W3', Meiryo, メイリオ, Osaka, 'MS PGothic', arial, helvetica, sans-serif",
		//stgWidth :  window.innerWidth,
		//stgHeight : window.innerHeight * 0.8,
		mojiScale : 0.9 // 表示文字サイズ（画面サイズに対する）
	},
	stage : null, // すてーじのインスタンス
	layerIdList : [], // 作られたれいやのIDのリスト
	currentIndex : 0, // ↑のアクティブなやつ

	/**
	 * ステージの生成
	 * @param {type} containerDivId 依代
	 * @returns {undefined}
	 */
	init : function(containerDivId){
		this.stage = new Konva.Stage({
			id : containerDivId + 'Stage',
			container: containerDivId,
			width: window.innerWidth, // width,height 動的にサイズ変更するためこうした
			height: window.innerHeight,
		});
		//console.log("initialize!", $.fn.jquery, this.constants, this.stage);
	},

	addMojiLayer : function(layerId, text){
		var rotate = 0;
		var shape = new Konva.Text({
			text: text,
			x: 0, y: 0, fontSize: 512,
			name: "mojiLayer",
			fontStyle: "bold",
			fontFamily: this.constants.fontFamily,
			fill: "#211917",
			rotation : rotate
		});
		// 画面サイズに縮小
		var scaleW = this.stage.getWidth() / shape.getWidth();
		var scaleH = this.stage.getHeight() / shape.getHeight();
		var scale = Math.min(scaleW, scaleH) * this.constants.mojiScale;
		shape.scaleX(scale);
		shape.scaleY(scale);
		// まんなかに配置
		var w = shape.getWidth() * scale;
		var h = shape.getHeight() * scale;
		shape.setX((this.stage.getWidth() - w) / 2);
		shape.setY((this.stage.getHeight() - h) / 2);
		// レイヤーを作って文字を追加
		var layer = new Konva.Layer({
			id : layerId
		});
		layer.add(shape);
		layer.hide(); // 非表示状態
		// ステージに追加
		this.stage.add(layer);
	},

	/**
	 * 全レイヤーの初期化
	 * @param {type} textList 文字の配列
	 */
	structMojiLayer : function (textList){
		// 現在のは破棄
		this.stage.find(".mojiLayer").destroy();
		this.layerIdList = [];
		// れいやを１つずつ作る
		for (var i = 0; i < textList.length; i++) {
			var id = "moji" + (i + 1);
			var text = textList[i];
			this.addMojiLayer(id, text);
			this.layerIdList.push(id);
			console.log(i, id, text, "のレイヤを生成したよ");
		}
		// 先頭の文字を表示状態に
		this.showMojiLayer(0);
	},

	/**
	 * 指定された文字レイヤーを表示
	 * @param {type} index いんでっくす
	 */
	showMojiLayer : function (index){
		// いま表示されてるのを消す
		// TODO 指定消しじゃなくて全れいや消したい
		var actKey = "#" + this.layerIdList[this.currentIndex];
		this.stage.find(actKey).hide();
		// indexのを表示
		index = (this.layerIdList.length + index) % this.layerIdList.length; // トグる
		var newKey = "#" + this.layerIdList[index];
		this.stage.findOne(newKey).show();
		this.stage.draw();
		this.currentIndex = index;
		console.log(index + " を表示したよ");
	},
	destroy : function() {
		this.stage.destroyChildren();
		this.stage.destroy();
	},
};

window.AppController = {
	init : function(){
		this.loadParam();
	},
	/**
	 * ストレージに保存
	 */
	saveParam : function(textList){
		var tlistJson = JSON.stringify(textList);
		localStorage.setItem("textList", tlistJson);
	},
	/**
	 * ストレージから読み込み
	 */
	loadParam : function(){
		// TODO すっきりさせたい
		var textList = JSON.parse(localStorage.getItem("textList"));
		if(textList == null){
			return;
		}
		var inputs = $(".moji-input");
		for (var i = 0; i < inputs.length; i++) {
			if(textList[i] == null){
				continue; // このContinueいる？
			}
			inputs[i].value = textList[i];
		}
		console.log("ストレージのデータを読み込んだよ！", textList);
	},
	send : function(){
		var inputs = $(".moji-input");
		var textList = [];
		for(var i = 0; i < inputs.length; i++){
			var text = $(inputs[i]).val();
			textList.push(text);
		}
		DispLbl.structMojiLayer(textList);
		this.saveParam(textList);
	},
	open : function(){
		// TODO ここでセレクタしたくない
		$("#moji-editor").hide();
		$("#moji-viewer").show();
	},
	close : function(){
		// TODO ここでセレクタしたくない
		$("#moji-viewer").hide();
		$("#moji-editor").show();
	},
	prev : function(){
		var index = DispLbl.currentIndex - 1;
		DispLbl.showMojiLayer(index);
	},
	next : function(){
		var index = DispLbl.currentIndex + 1;
		DispLbl.showMojiLayer(index);
	},
	refresh : function(){
		var beforeIndex = DispLbl.currentIndex;
		DispLbl.destroy();
		DispLbl.init("container");
		this.send();
		DispLbl.showMojiLayer(beforeIndex);
	},
	clear : function () {
		$(".moji-input").val("");
	}

};

$(function(){
	try{
		DispLbl.init("container");
		AppController.init();
		// ボタンのイベントをセット
		$("#moji-send"  ).on("click", function(){ AppController.send(); AppController.open() });
		$("#moji-close" ).on("click", function(){ AppController.close() });
		$("#moji-next"  ).on("click", function(){ AppController.next() });
		$("#moji-prev"  ).on("click", function(){ AppController.prev() });
		$("#moji-allclear"  ).on("click", function(){ AppController.clear() });
		// 画面サイズ変更完了を検知
		var timer = false;
			$(window).resize(function() {
			if (timer !== false) {
				clearTimeout(timer);
			}
			timer = setTimeout(function() {
				AppController.refresh();
			}, 128);
		});

	}catch(e){
		alert("どうしようもねえエラーだ、すまんな。 \n" + e.name + ": " + e.message);
	}
});


