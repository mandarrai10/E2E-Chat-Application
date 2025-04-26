var switchLoginForm = function (e) {
  $("#login-form-container").toggleClass("visible hidden");
  $("#register-form-container").toggleClass("visible hidden");
  if ($("#login-form-container").hasClass("visible")) {
    $("h1").text("Log in to your account");
    $(".login-link").html(
      'Don\'t have an account? <a href="#" id="s-inscrire">Sign up</a>'
    );
  } else {
    $("h1").text("Create an account");
    $(".login-link").html(
      'Already have an account? <a href="#" id="se-connecter">Log in</a>'
    );
  }
  $(".error-message").addClass("hidden").removeClass("visible");
  $("#login-form")[0].reset();
  $("#register-form")[0].reset();
  $(".strength-bar").css("width", "0%");
};

var printErrorLoginForm = function (res) {
  if (res.status === 409) {
    $("#errorRegister").removeClass("hidden").addClass("visible");
  } else if (res.status === 400) {
    $("#errorLogin").removeClass("hidden").addClass("visible");
  }
};

function togglePasswordVisibility(inputId) {
  var input = document.getElementById(inputId);
  var icon = input.nextElementSibling.querySelector("i");
  if (input.type === "password") {
    input.type = "text";
    icon.classList.remove("fa-eye");
    icon.classList.add("fa-eye-slash");
  } else {
    input.type = "password";
    icon.classList.remove("fa-eye-slash");
    icon.classList.add("fa-eye");
  }
}

function updateWindow() {
  if ($(window).width() < 770) {
    $(".side").hide();
  } else {
    $(".side").show();
  }
}

// Slideshow functionality
function setupSlideshow() {
  const dots = document.querySelectorAll(".dot");
  const slides = document.querySelectorAll(".slide");
  let currentSlide = 0;
  let slideInterval;

  // Function to change slide
  function changeSlide(index) {
    // Remove active class from all slides and dots
    slides.forEach((slide) => slide.classList.remove("active"));
    dots.forEach((dot) => dot.classList.remove("active"));

    // Add active class to current slide and dot
    slides[index].classList.add("active");
    dots[index].classList.add("active");

    // Update current slide index
    currentSlide = index;
  }

  // Start automatic slideshow
  function startSlideshow() {
    slideInterval = setInterval(() => {
      let nextSlide = (currentSlide + 1) % slides.length;
      changeSlide(nextSlide);
    }, 5000); // Change slide every 5 seconds
  }

  // Stop slideshow on user interaction
  function stopSlideshow() {
    clearInterval(slideInterval);
  }

  // Add click event to dots
  dots.forEach((dot, index) => {
    dot.addEventListener("click", function () {
      stopSlideshow(); // Stop auto rotation when user clicks
      changeSlide(index);
      startSlideshow(); // Restart auto rotation
    });
  });

  // Initialize slideshow
  startSlideshow();
}

window.addEventListener("DOMContentLoaded", async (event) => {
  updateWindow();
  window.addEventListener("resize", updateWindow);

  // Initialize slideshow
  setupSlideshow();

  // Password strength bar
  let password_input = document.getElementById("passwordSignup");
  let strengthBar = document.querySelector(".strength-bar");

  function StrengthChecker(password) {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (password.length === 0) {
      strengthBar.style.width = "0%";
      strengthBar.style.backgroundColor = "#9370DB";
    } else if (strength <= 2) {
      strengthBar.style.width = "33%";
      strengthBar.style.backgroundColor = "#F44336";
    } else if (strength === 3 || strength === 4) {
      strengthBar.style.width = "66%";
      strengthBar.style.backgroundColor = "#FF9800";
    } else if (strength >= 5) {
      strengthBar.style.width = "100%";
      strengthBar.style.backgroundColor = "#4CAF50";
    }
  }

  password_input.addEventListener("input", () => {
    StrengthChecker(password_input.value);
  });

  // Form switching
  $(document).on("click", "#se-connecter, #login-link", function (e) {
    e.preventDefault();
    if ($("#login-form-container").hasClass("hidden")) {
      switchLoginForm();
    }
  });

  $(document).on("click", "#s-inscrire", function (e) {
    e.preventDefault();
    if ($("#register-form-container").hasClass("hidden")) {
      switchLoginForm();
    }
  });

  // Password visibility toggle
  $(document).on("click", ".password-toggle", function () {
    var inputId = $(this).prev().attr("id");
    togglePasswordVisibility(inputId);
  });

  // Login form submit
  let loginform = document.querySelector("#login-form");
  loginform.addEventListener("submit", async (e) => {
    e.preventDefault();
    let body = {
      usernameLogin: loginform.elements.usernameLogin.value,
      passwordLogin: loginform.elements.passwordLogin.value,
    };
    const res = await fetch("/api/users/login", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
    const data = res.json();
    data
      .then((response) => {
        if (response.status === 200) {
          window.location = response.redirect;
        } else {
          printErrorLoginForm(response);
        }
      })
      .catch((error) => console.error("Error:", error));
  });

  // Register form submit
  let registerform = document.querySelector("#register-form");
  registerform.addEventListener("submit", async (e) => {
    e.preventDefault();
    let body = {
      usernameSignup: registerform.elements.usernameSignup.value,
      passwordSignup: registerform.elements.passwordSignup.value,
    };
    const res = await fetch("/api/users/register", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
    const data = res.json();
    data
      .then((response) => {
        if (response.status === 201) {
          window.location = response.redirect;
        } else {
          printErrorLoginForm(response);
        }
      })
      .catch((error) => console.error("Error:", error));
  });
});
