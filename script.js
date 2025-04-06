const recipeDatabase = {
    "trứng": {
        dish: "Trứng chiên ít dầu",
        recipe: "Đập trứng, thêm chút muối, đánh đều và chiên bằng chảo chống dính không dầu."
    },
    "gà": {
        dish: "Ức gà hấp gừng",
        recipe: "Thái ức gà, ướp với muối và gừng thái lát, hấp trong 15-20 phút."
    },
    "rau muống": {
        dish: "Rau muống luộc",
        recipe: "Đun sôi nước, cho thêm chút muối, luộc rau muống khoảng 3-5 phút."
    },
    "nấm": {
        dish: "Nấm xào tỏi",
        recipe: "Thái nấm, phi thơm tỏi, xào nấm với chút dầu olive, nêm nhạt."
    },
    "bông cải xanh": {
        dish: "Bông cải xanh hấp",
        recipe: "Rửa sạch bông cải, hấp vừa chín trong 5-7 phút."
    },
    "cá": {
        dish: "Cá hấp hành gừng",
        recipe: "Làm sạch cá, ướp với hành và gừng thái sợi, đem hấp khoảng 15 phút."
    }
};

function showOtherDiseaseInput() {
    const otherDiseaseInput = document.getElementById('otherDiseaseInput');
    if (document.querySelector('input[name="diseases"][value="Khác"]:checked')) {
        otherDiseaseInput.style.display = 'block';
    } else {
        otherDiseaseInput.style.display = 'none';
    }
}

function calculateBMI() {
    const name = document.getElementById('name').value;
    const height = parseFloat(document.getElementById('height').value);
    const weight = parseFloat(document.getElementById('weight').value);
    const result = document.getElementById('result');
    const suggestions = document.getElementById('suggestions');
    const diseaseList = document.getElementById('disease-list');
    const ingredientsInput = document.getElementById('ingredients').value.trim().toLowerCase();
    const ingredients = ingredientsInput ? ingredientsInput.split(',').map(i => i.trim()) : [];
    const selectedDiseases = Array.from(document.querySelectorAll('input[name="diseases"]:checked')).map(checkbox => checkbox.value);
    const otherDisease = document.getElementById('otherDisease').value.trim();

    if (!name || isNaN(height) || isNaN(weight) || height <= 0 || weight <= 0) {
        result.innerHTML = "Vui lòng nhập đầy đủ và hợp lệ thông tin.";
        suggestions.innerHTML = "";
        diseaseList.innerHTML = "";
        return;
    }

    if (selectedDiseases.includes("Khác") && !otherDisease) {
        result.innerHTML = "Vui lòng nhập tên bệnh khi chọn 'Khác'.";
        return;
    }

    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    let category = "";

    if (bmi < 18.5) category = "Thiếu cân";
    else if (bmi < 24.9) category = "Bình thường";
    else if (bmi < 29.9) category = "Thừa cân";
    else category = "Béo phì";

    const bmiResult = `${name}, tình trạng của bạn (${category})`;
    result.innerHTML = bmiResult;

    let suggestionHTML = '<ul class="suggestions">';
    let found = false;

    if (ingredients.length > 0) {
        ingredients.forEach(ing => {
            if (recipeDatabase[ing]) {
                found = true;
                suggestionHTML += `<li><strong>${recipeDatabase[ing].dish}</strong><div class="recipe">${recipeDatabase[ing].recipe}</div></li>`;
            }
        });
    }

    if (!found) {
        suggestionHTML += '<li><strong>Gợi ý nguyên liệu:</strong> trứng, gà, nấm</li>';
        suggestionHTML += '<li><strong>Món gợi ý:</strong></li>';
        Object.values(recipeDatabase).forEach(recipe => {
            suggestionHTML += `<li><strong>${recipe.dish}</strong><div class="recipe">${recipe.recipe}</div></li>`;
        });
    }

    suggestionHTML += '</ul>';
    suggestions.innerHTML = suggestionHTML;

    // Liệt kê các bệnh đã chọn
    if (selectedDiseases.length > 0) {
        if (selectedDiseases.includes("Khác") && otherDisease) {
            selectedDiseases[selectedDiseases.indexOf("Khác")] = otherDisease;
        }
        diseaseList.innerHTML = `<ul><li>${selectedDiseases.join('</li><li>')}</li></ul>`;
    } else {
        diseaseList.innerHTML = "<p>Không có bệnh nào được chọn.</p>";
    }

}


async function scanImage() {
  const input = document.getElementById('imageInput');
  const file = input.files[0];
  if (!file) {
    alert("Vui lòng chọn hoặc chụp ảnh.");
    return;
  }

  const reader = new FileReader();
  reader.onloadend = async function () {
    const base64Image = reader.result.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

    const apiKey = 'AIzaSyBjkpsVWWvR-2bY6I9SlzfqdWCxGQ-7P9w'; // 🔑 Thay bằng API key của bạn

    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [{
          image: { content: base64Image },
          features: [
            { type: "LABEL_DETECTION", maxResults: 5 },
            { type: "TEXT_DETECTION" }
          ]
        }]
      })
    });

    const result = await response.json();
    const res = result.responses[0];
    let output = "🔍 Kết quả từ ảnh:\n\n";
    let topLabel = "";

    if (res.labelAnnotations) {
      output += "🏷 Nhãn ảnh:\n";
      res.labelAnnotations.forEach((label, index) => {
        output += `- ${label.description} (${Math.round(label.score * 100)}%)\n`;
        if (index === 0) topLabel = label.description;
    });
      output += "\n";
    }

    if (res.textAnnotations && res.textAnnotations.length > 0) {
      output += "📝 Văn bản trích xuất:\n";
      output += res.textAnnotations[0].description.trim() + "\n\n";
    }

    if (topLabel) {
      output += "ℹ️ Thông tin về đối tượng chính:\n";
      try {
        const wikiResponse = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topLabel)}`
        );
        const wikiData = await wikiResponse.json();
        if (wikiData.extract) {
          output += `📘 ${wikiData.extract}`;
        } else {
          output += "Không tìm thấy thông tin.";
        }
      } catch (err) {
        output += "Lỗi khi tra cứu thông tin.";
      }
    }

    if (!res.labelAnnotations && (!res.textAnnotations || res.textAnnotations.length === 0)) {
      output += "❌ Không nhận diện được nội dung.";
    }

    document.getElementById('vision-result').textContent = output;
  };

  reader.readAsDataURL(file);
}




