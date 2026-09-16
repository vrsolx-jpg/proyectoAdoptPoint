package com.example.proyecto

import android.content.Context
import android.content.Intent
import android.content.res.ColorStateList
import android.graphics.Color
import android.os.Bundle
import android.util.Patterns
import android.widget.Button
import android.widget.CheckBox
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.google.android.material.textfield.TextInputEditText
import com.google.android.material.textfield.TextInputLayout

class RegisterActivity : AppCompatActivity() {

    private lateinit var preferences: android.content.SharedPreferences

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        enableEdgeToEdge()

        setContentView(R.layout.activity_register)

        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->

            val systemBars =
                insets.getInsets(WindowInsetsCompat.Type.systemBars())

            v.setPadding(
                systemBars.left,
                systemBars.top,
                systemBars.right,
                systemBars.bottom
            )

            insets
        }

        // ==========================================
        // SHARED PREFERENCES
        // ==========================================

        preferences = getSharedPreferences(
            "adopt_point_preferences",
            Context.MODE_PRIVATE
        )

        // ==========================================
        // REFERENCIAS
        // ==========================================

        val root =
            findViewById<ScrollView>(
                R.id.main
            )

        val container =
            root.getChildAt(0) as LinearLayout

        // En el XML original:
        // 0 = Crear cuenta
        // 1 = Únete y ayuda a cambiar vidas
        val tvRegisterTitle =
            container.getChildAt(0) as TextView

        val tvRegisterSubtitle =
            container.getChildAt(1) as TextView

        val btnCrearCuenta =
            findViewById<Button>(
                R.id.btnCrearCuenta
            )

        val cbTerminos =
            findViewById<CheckBox>(
                R.id.cbTerminos
            )

        // ==========================================
        // RECUPERAR MODO OSCURO
        // ==========================================

        val darkMode =
            preferences.getBoolean(
                "dark_mode",
                false
            )

        aplicarTema(
            darkMode,
            root,
            container,
            tvRegisterTitle,
            tvRegisterSubtitle,
            cbTerminos,
            btnCrearCuenta
        )

        // ==========================================
        // CREAR CUENTA
        // ==========================================

        btnCrearCuenta.setOnClickListener {

            if (validarFormulario()) {

                val nombre =
                    findViewById<TextInputEditText>(
                        R.id.etNombre
                    ).text.toString().trim()

                val apellido =
                    findViewById<TextInputEditText>(
                        R.id.etApellido
                    ).text.toString().trim()

                val email =
                    findViewById<TextInputEditText>(
                        R.id.etCorreo
                    ).text.toString().trim()

                val edad =
                    findViewById<TextInputEditText>(
                        R.id.etEdad
                    ).text.toString().trim()

                val cedula =
                    findViewById<TextInputEditText>(
                        R.id.etCedula
                    ).text.toString().trim()

                val telefono =
                    findViewById<TextInputEditText>(
                        R.id.etTelefono
                    ).text.toString().trim()

                val password =
                    findViewById<TextInputEditText>(
                        R.id.etContrasena
                    ).text.toString()

                // ==================================
                // GUARDAR DATOS
                // ==================================

                preferences.edit()
                    .putString(
                        "username",
                        nombre
                    )
                    .putString(
                        "apellido",
                        apellido
                    )
                    .putString(
                        "email",
                        email
                    )
                    .putString(
                        "edad",
                        edad
                    )
                    .putString(
                        "cedula",
                        cedula
                    )
                    .putString(
                        "telefono",
                        telefono
                    )
                    .putString(
                        "password",
                        password
                    )
                    .putBoolean(
                        "is_logged_in",
                        false
                    )
                    .apply()

                Toast.makeText(
                    this,
                    "¡Registro exitoso! Por favor inicia sesión",
                    Toast.LENGTH_SHORT
                ).show()

                val intent =
                    Intent(
                        this,
                        LoginActivity::class.java
                    )

                intent.putExtra(
                    "CORREO_PREVIO",
                    email
                )

                startActivity(intent)

                finish()
            }
        }
    }

    // ==========================================
    // APLICAR TEMA
    // ==========================================

    private fun aplicarTema(
        darkMode: Boolean,
        root: ScrollView,
        container: LinearLayout,
        tvRegisterTitle: TextView,
        tvRegisterSubtitle: TextView,
        cbTerminos: CheckBox,
        btnCrearCuenta: Button
    ) {

        val idsTextInput = intArrayOf(
            R.id.layoutNombre,
            R.id.layoutApellido,
            R.id.layoutCorreo,
            R.id.layoutEdad,
            R.id.layoutCedula,
            R.id.layoutTelefono,
            R.id.layoutContrasena
        )

        val idsEditText = intArrayOf(
            R.id.etNombre,
            R.id.etApellido,
            R.id.etCorreo,
            R.id.etEdad,
            R.id.etCedula,
            R.id.etTelefono,
            R.id.etContrasena
        )

        if (darkMode) {

            // ======================================
            // MODO OSCURO
            // ======================================

            root.setBackgroundColor(
                Color.parseColor("#4D311B")
            )

            container.setBackgroundColor(
                Color.parseColor("#4D311B")
            )

            // ======================================
            // TÍTULOS
            // ======================================

            tvRegisterTitle.setTextColor(
                Color.parseColor("#F1E9D2")
            )

            tvRegisterSubtitle.setTextColor(
                Color.parseColor("#F1E9D2")
            )

            // ======================================
            // CAMPOS
            // ======================================

            val colorStateListHint = ColorStateList.valueOf(Color.parseColor("#F1E9D2"))
            val colorStateListStroke = ColorStateList(
                arrayOf(intArrayOf(android.R.attr.state_focused), intArrayOf()),
                intArrayOf(Color.parseColor("#F1E9D2"), Color.parseColor("#F1E9D2"))
            )

            for (id in idsTextInput) {
                val layout = findViewById<TextInputLayout>(id)
                layout.setBoxBackgroundColor(Color.parseColor("#614326"))
                layout.setHintTextColor(colorStateListHint)
                layout.setDefaultHintTextColor(colorStateListHint)
                layout.setBoxStrokeColorStateList(colorStateListStroke)
                
                if (id == R.id.layoutContrasena) {
                    layout.setEndIconTintList(colorStateListHint)
                }
            }

            // ======================================
            // TEXTO DE LOS CAMPOS
            // ======================================

            for (id in idsEditText) {

                val editText =
                    findViewById<TextInputEditText>(
                        id
                    )

                editText.setTextColor(
                    Color.parseColor("#F1E9D2")
                )

                editText.setHintTextColor(
                    Color.parseColor("#F1E9D2")
                )
            }

            // ======================================
            // TÉRMINOS
            // ======================================

            cbTerminos.setTextColor(
                Color.parseColor("#F1E9D2")
            )

            // ======================================
            // BOTÓN
            // ======================================

            btnCrearCuenta.backgroundTintList =
                ColorStateList.valueOf(
                    Color.parseColor("#F1E9D2")
                )

            btnCrearCuenta.setTextColor(
                Color.parseColor("#4D311B")
            )

        } else {

            // ======================================
            // MODO CLARO
            // ======================================

            root.setBackgroundColor(
                Color.parseColor("#F1E9D2")
            )

            container.setBackgroundColor(
                Color.parseColor("#EFE7D0")
            )

            // ======================================
            // TÍTULOS
            // ======================================

            tvRegisterTitle.setTextColor(
                Color.parseColor("#3E2723")
            )

            tvRegisterSubtitle.setTextColor(
                Color.parseColor("#4D311B")
            )

            // ======================================
            // CAMPOS
            // ======================================

            for (id in idsTextInput) {

                val layout =
                    findViewById<TextInputLayout>(
                        id
                    )

                layout.setBoxBackgroundColor(
                    Color.TRANSPARENT
                )

                layout.setHintTextColor(
                    ColorStateList.valueOf(
                        Color.parseColor("#795548")
                    )
                )

                layout.setDefaultHintTextColor(
                    ColorStateList.valueOf(
                        Color.parseColor("#795548")
                    )
                )

                layout.setBoxStrokeColor(
                    Color.parseColor("#795548")
                )

                if (id == R.id.layoutContrasena) {
                    layout.setEndIconTintList(
                        ColorStateList.valueOf(
                            Color.parseColor("#4D311B")
                        )
                    )
                }
            }

            // ======================================
            // TEXTO DE LOS CAMPOS
            // ======================================

            for (id in idsEditText) {

                val editText =
                    findViewById<TextInputEditText>(
                        id
                    )

                editText.setTextColor(
                    Color.parseColor("#4D311B")
                )

                editText.setHintTextColor(
                    Color.parseColor("#795548")
                )
            }

            // ======================================
            // TÉRMINOS
            // ======================================

            cbTerminos.setTextColor(
                Color.parseColor("#4D311B")
            )

            // ======================================
            // BOTÓN
            // ======================================

            btnCrearCuenta.backgroundTintList =
                ColorStateList.valueOf(
                    Color.parseColor("#4D311B")
                )

            btnCrearCuenta.setTextColor(
                Color.parseColor("#F1E9D2")
            )
        }
    }

    // ==========================================
    // VALIDAR FORMULARIO
    // ==========================================

    private fun validarFormulario(): Boolean {

        var esValido = true

        val layoutNombre =
            findViewById<TextInputLayout>(
                R.id.layoutNombre
            )

        val etNombre =
            findViewById<TextInputEditText>(
                R.id.etNombre
            ).text.toString().trim()

        val layoutCorreo =
            findViewById<TextInputLayout>(
                R.id.layoutCorreo
            )

        val etCorreo =
            findViewById<TextInputEditText>(
                R.id.etCorreo
            ).text.toString().trim()

        val layoutEdad =
            findViewById<TextInputLayout>(
                R.id.layoutEdad
            )

        val etEdad =
            findViewById<TextInputEditText>(
                R.id.etEdad
            ).text.toString().trim()

        val layoutCedula =
            findViewById<TextInputLayout>(
                R.id.layoutCedula
            )

        val etCedula =
            findViewById<TextInputEditText>(
                R.id.etCedula
            ).text.toString().trim()

        val layoutTelefono =
            findViewById<TextInputLayout>(
                R.id.layoutTelefono
            )

        val etTelefono =
            findViewById<TextInputEditText>(
                R.id.etTelefono
            ).text.toString().trim()

        val layoutContrasena =
            findViewById<TextInputLayout>(
                R.id.layoutContrasena
            )

        val etContrasena =
            findViewById<TextInputEditText>(
                R.id.etContrasena
            ).text.toString()

        val cbTerminos =
            findViewById<CheckBox>(
                R.id.cbTerminos
            )

        // ==========================================
        // NOMBRE
        // ==========================================

        val regexLetras =
            Regex(
                "^[a-zA-ZáéíóúÁÉÍÓÚñÑ\\s]+$"
            )

        if (
            etNombre.isEmpty() ||
            !etNombre.matches(regexLetras)
        ) {

            layoutNombre.error =
                "Ingresa un nombre válido (sin números)"

            esValido = false

        } else {

            layoutNombre.error = null
        }

        // ==========================================
        // CORREO
        // ==========================================

        if (
            etCorreo.isEmpty() ||
            !Patterns.EMAIL_ADDRESS
                .matcher(etCorreo)
                .matches()
        ) {

            layoutCorreo.error =
                "Ingresa un correo válido"

            esValido = false

        } else {

            layoutCorreo.error = null
        }

        // ==========================================
        // EDAD
        // ==========================================

        val edadNum =
            etEdad.toIntOrNull()

        if (
            edadNum == null ||
            edadNum <= 0 ||
            edadNum > 120
        ) {

            layoutEdad.error =
                "Edad inválida (Máx 120)"

            esValido = false

        } else {

            layoutEdad.error = null
        }

        // ==========================================
        // CÉDULA
        // ==========================================

        val regexNumeros =
            Regex("^[0-9]+$")

        if (
            etCedula.isEmpty() ||
            !etCedula.matches(regexNumeros)
        ) {

            layoutCedula.error =
                "Cédula inválida"

            esValido = false

        } else {

            layoutCedula.error = null
        }

        // ==========================================
        // TELÉFONO
        // ==========================================

        if (etTelefono.isNotEmpty()) {

            if (
                etTelefono.length != 10 ||
                !etTelefono.matches(regexNumeros)
            ) {

                layoutTelefono.error =
                    "Debe tener 10 dígitos (formato Colombia)"

                esValido = false

            } else {

                layoutTelefono.error = null
            }

        } else {

            layoutTelefono.error = null
        }

        // ==========================================
        // CONTRASEÑA
        // ==========================================

        val regexPassword =
            Regex(
                "^(?=.*[0-9])(?=.*[A-Z])(?=.*[.,*#\\$%^&+=!]).{8,}$"
            )

        if (
            !etContrasena.matches(
                regexPassword
            )
        ) {

            layoutContrasena.error =
                "Mín 8 caracteres, 1 mayúscula, 1 número y 1 especial"

            esValido = false

        } else {

            layoutContrasena.error = null
        }

        // ==========================================
        // TÉRMINOS
        // ==========================================

        if (!cbTerminos.isChecked) {

            Toast.makeText(
                this,
                "Debes aceptar los términos y condiciones",
                Toast.LENGTH_LONG
            ).show()

            esValido = false
        }

        return esValido
    }
}