$(function () {
    const MIN_INDEX = 1;
    const MAX_INDEX = 100;
    var curIndex = MIN_INDEX;
    //每个问题答案的ID
    var curAnswerId;
    //当前问题的ID
    var curAnswerId = 1;

    //要存储的数据 
    const STORAGE_KEY = "driverData";
    var driverData;

    //封装localStorage
    var storage = {
        obj: window.localStorage,
        set: function (key, value) {
            this.obj.setItem(key, value);
        },
        get: function (key) {
            return this.obj.getItem(key);
        },
        remove: function (key) {
            this.obj.removeItem(key);
        },
        clear: function () {
            this.obj.clear();
        }
    }
    //存储的函数
    function saveData() {
        storage.set(STORAGE_KEY, JSON.stringify(driverData));
    }

    //删除数据
    function removeData() {
        storage.remove(STORAGE_KEY);
    }



    //重置所有的数据
    function resetData() {
        driverData = {
            id: 1,//题号
            // 已经答的数量
            answeredNum: 0,
            //答对的数量
            rightNum: 0,
            //答错的数量
            wrongNum: 0,
            //答对的id 的数组
            rightArr: [],
            wrongArr: [],

        }
        curIndex = MIN_INDEX;
        curQuestionId = 1;
    }

    //4.1初始化所有题目按钮
    (function () {
        //初始化所有页面的数据
        resetData();
        topicSurface();
        loadPageData();
    })();

    function loadPageData() {
        //如果有数据，询问是否加载数据
        var jsonStr = storage.get(STORAGE_KEY);
        if (jsonStr) {
            var data = JSON.parse(jsonStr);
            var id = data.id;
            //获取保存的数据，
            var result = confirm(`您已经看到[${id}]题目了，是否继续？`);
            if (result) {
                //继续答题
                driverData = data;
                //拉取保存的id 的题目的数据。
                getData(id);
                curIndex = id;
                //显示统计信息
                answerDataShow();
                //重新渲染问题div 列表
                loadQuestionList();
            } else {//重新答题
                restartAnswer();
            }
        } else { //没有数据，加载第一页
            getData(1);
        }
    }


    //重新渲染问题div 列表
    function loadQuestionList() {
        for (var i = 0; i < driverData.rightArr.length; i++) {
            var id = driverData.rightArr[i];
            $(".wrapper .container .item").eq(id - 1).addClass("rightOk");
        }
        for (var i = 0; i < driverData.wrongArr.length; i++) {
            var id = driverData.wrongArr[i];
            $(".wrapper .container .item").eq(id - 1).addClass("error");
        }
    }

    //4.显示所有的题号列表
    function topicSurface() {
        var content = "";
        for (var i = 0; i < MAX_INDEX; i++) {
            content += `<div class="item ">${i + 1}</div>`;
        }
        $(".wrapper .container").html(content);
    }

    // 重置 当前问题列表的样式
    function resetQuestionList() {
        //只把答过的题目的div 样式重置
        for (var i = 0; i < driverData.rightArr.length; i++) {
            var id = driverData.rightArr[i];
            $(".wrapper .container .item").eq(id - 1).attr("class", "item");
        }
        for (var i = 0; i < driverData.wrongArr.length; i++) {
            var id = driverData.wrongArr[i];
            $(".wrapper .container .item").eq(id - 1).attr("class", "item");
        }
    }

    //1.获取数据----------------------
    function getData(num) {
        $.ajax({
            type: 'get',
            url: 'php/getQuestion.php',
            data: {
                num: num
            },
            dataType: 'json',
            success: function (res) {
                answerData(res);
            }
        })
    }

    function answerData(res) {
        const TYPE_TWO = 1;
        const TYPE_FOUR = 2;
        console.log(res);
        var title = res.question;
        var type = res.Type;
        var id = res.id;
        curQuestionId = id;
        //将获取的当前的问题的id 保存
        driverData.id = curQuestionId;
        saveData();

        //答案的值
        curAnswerId = res.ta;
        //1.1 获取题号和问题
        $(".title1 p").html(id + '.' + title);
        //1.2 获取选择的题目 
        if (type == TYPE_FOUR) {
            let str = `<label for=""><input type="radio" name="sel" value="1" id="1"> A: ${res.a}</label>
            <label for=""><input type="radio" name="sel" value="2" id="2"> B: ${res.b}</label>
            <label for=""><input type="radio" name="sel" value="3" id="3"> C: ${res.c}</label>
            <label for=""><input type="radio" name="sel" value="4" id="4"> D: ${res.d}</label>`
            $(".sel").html(str);
        } else if (type == TYPE_TWO) {
            let str = `
            <label for=""><input type="radio" name="sel" value="1" id="1"> 正确</label>
            <label for=""><input type="radio" name="sel" value="2" id="2"> 错误</label>`
            $(".sel").html(str);
        }
        highlightState(id);
    }

    //2.上一题
    $(".fenye .prev").click(function () {
        curIndex--;
        if (curIndex < MIN_INDEX) {
            curIndex = MIN_INDEX;
            return;
        }
        getData(curIndex);
        showAnswerInfo("");
    })

    //3.下一题
    $(".fenye .next").click(function () {
        curIndex++;
        if (curIndex > MAX_INDEX) {
            curIndex = MAX_INDEX;
            return;
        }
        getData(curIndex);
        showAnswerInfo("");
    })
    //重置
    $(".fenye .begin").click(function () {
        var result = confirm("确定重新开始吗？");
        if (result) {
            restartAnswer();
        }
    })

    //4.2设置当前题号对应的问题列表按钮中的按钮为高亮选中状态
    function highlightState(num) {
        $(".wrapper .container .item").eq(num - 1).addClass("active").siblings().removeClass("active");
    }
    //5答题
    //使用事件代理来处理选择项的事件
    $(".content .sel").on("click", "input", function () {
        if (isAnswered()) {
            $(".sel input").attr("disabled", true);
            showAnswerInfo("<span class='w'>题目已经答过了!</span>");
        } else {
            answerQuestion(this.value);
        }
    })

    //判断当时问题ID是否存在数组中
    function isAnswered() {
        if (driverData.rightArr.indexOf(curQuestionId) >= 0)
            return true;
        if (driverData.wrongArr.indexOf(curQuestionId) >= 0)
            return true;
        return false;
    }
    //5.1答题逻辑
    function answerQuestion(selectValue) {
        if (selectValue == curAnswerId) {
            answerRight();
        } else {
            answerWrong();
        }
    }
    //5.2答对逻辑
    function answerRight() {
        //提示答对信息
        // $(".content .daan").html('<span>恭喜你对了！</span>');
        showAnswerInfo("<span>恭喜你对了！</span>");
        //修改列表div的颜色
        $(".wrapper .container .item").eq(curIndex - 1).addClass("rightOk");
        //答完的题不能重复作答
        $(".sel input").attr("disabled", true);
        // //将答题的结果保存
        driverData.rightArr.push(curQuestionId);
        driverData.rightNum++;
        driverData.answeredNum++;
        saveData();
        answerDataShow();
    }
    //5.3答错逻辑
    function answerWrong() {
        //提示答对信息
        // $(".content .daan").html("<span class='w'>很遗憾回答错误！</span>");
        showAnswerInfo("<span class ='w'>很遗憾回答错误！</span>");
        //修改列表div的颜色
        $(".wrapper .container .item").eq(curIndex - 1).addClass("error");
        //答完的题不能重复作答
        $(".sel input").attr("disabled", true);
        // //将答题的结果保存
        driverData.wrongArr.push(curQuestionId);
        driverData.wrongNum++;
        driverData.answeredNum++;
        saveData();
        answerDataShow();
    }

    //设置答题的结果部分的内容
    function showAnswerInfo(info) {
        $(".content .daan").html(info);
    }
    //将当前的答题数据展示
    function answerDataShow() {
        $(".tongji .zong").html(driverData.answeredNum);
        $(".tongji .right").html(driverData.rightNum);
        $(".tongji .wrong").html(driverData.wrongNum);
        var result = (driverData.rightNum / driverData.answeredNum * 100).toFixed(2);
        if (isNaN(result)) {
            result = "0.00";
        }
        var percent = result + "%";
        $(".tongji .lv").html(percent);
    }

    //刷新页面的功能
    function restartAnswer() {
        //删除已存的数据
        removeData();
        //将内存中的数据重置
        resetData();
        //清空列表中样式
        topicSurface();
        //清除当前无用的数据
        showAnswerInfo("");
        //重新计算统计的信息
        answerDataShow();
        //重置题目列表的样式 清除所有的样式
        resetQuestionList();
        //重新请求第一页的数据
        getData(1);
    }
})