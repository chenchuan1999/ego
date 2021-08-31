<?php

    //访问答题的接口 需要参数 请求的是第几题
    $n = $_GET['num'];
    $con = file_get_contents("http://mnks.jxedt.com/get_question?r=0.2544343069870654&index=$n");
    echo $con;
    
?>