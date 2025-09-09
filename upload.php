<?php
header('Content-Type: application/json; charset=utf-8');

$targetDir = "img/Foto/";

if (!empty($_FILES["photoUpload"]["name"])) {
    $fileName = time() . "_" . basename($_FILES["photoUpload"]["name"]); // унікальне ім'я
    $targetFilePath = $targetDir . $fileName;

    $fileType = strtolower(pathinfo($targetFilePath, PATHINFO_EXTENSION));
    $allowTypes = ["jpg","jpeg","png","gif","webp"];

    if(in_array($fileType, $allowTypes)){
        if(move_uploaded_file($_FILES["photoUpload"]["tmp_name"], $targetFilePath)){
            echo json_encode([
                "success" => true,
                "filepath" => $targetFilePath
            ]);
        } else {
            echo json_encode([
                "success" => false,
                "message" => "Не вдалося зберегти файл."
            ]);
        }
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Дозволені тільки JPG, JPEG, PNG, GIF, WEBP."
        ]);
    }
} else {
    echo json_encode([
        "success" => false,
        "message" => "Файл не вибрано."
    ]);
}
