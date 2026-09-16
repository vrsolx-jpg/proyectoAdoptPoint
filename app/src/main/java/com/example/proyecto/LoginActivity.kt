package com.example.proyecto

import android.content.Context
import android.content.Intent
import android.content.res.ColorStateList
import android.graphics.Color
import android.os.Bundle
import android.widget.Button
import android.widget.CheckBox
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

class LoginActivity : AppCompatActivity() {

    private lateinit var preferences: android.content.SharedPreferences

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        enableEdgeToEdge()

        setContentView(R.layout.activity_login)

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
            findViewById<ScrollView>(R.id.main)

        val container =
            root.getChildAt(0) as LinearLayout

        // Los dos primeros TextView del XML original:
        // 0 = "Bienvenido"
        // 1 = "Ingresa a tu cuenta para continuar"
        val tvBienvenido =
            container.getChildAt(0) as TextView

        val tvSubtitulo =
            container.getChildAt(1) as TextView

        // LinearLayout que contiene:
        // CheckBox "Recordarme"
        // TextView "¿Olvidaste tu contraseña?"
        val rememberRow =
            container.getChildAt(4) as LinearLayout

        val tvOlvidaste =
            rememberRow.getChildAt(1) as TextView

        val layoutCorreo =
            findViewById<TextInputLayout>(
                R.id.layoutLoginCorreo
            )

        val etCorreo =
            findViewById<TextInputEditText>(
                R.id.etLoginCorreo
            )

        val layoutPass =
            findViewById<TextInputLayout>(
                R.id.layoutLoginPass
            )

        val etPass =
            findViewById<TextInputEditText>(
                R.id.etLoginPass
            )

        val cbRecordarme =
            findViewById<CheckBox>(
                R.id.cbRecordarme
            )

        val btnIniciar =
            findViewById<Button>(
                R.id.btnIniciarSesion
            )

        val tvIrRegistro =
            findViewById<TextView>(
                R.id.tvIrRegistro
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
            tvBienvenido,
            tvSubtitulo,
            tvOlvidaste,
            layoutCorreo,
            etCorreo,
            layoutPass,
            etPass,
            cbRecordarme,
            btnIniciar,
            tvIrRegistro
        )

        // ==========================================
        // MENSAJE DE BIENVENIDA
        // ==========================================

        val mensajeBienvenida =
            intent.getStringExtra(
                "MENSAJE_BIENVENIDA"
            )

        if (mensajeBienvenida != null) {

            Toast.makeText(
                this,
                mensajeBienvenida,
                Toast.LENGTH_SHORT
            ).show()
        }

        // ==========================================
        // RECUPERAR CORREO GUARDADO
        // ==========================================

        val correoGuardado =
            preferences.getString(
                "email",
                ""
            )

        val recordarSesion =
            preferences.getBoolean(
                "remember_session",
                false
            )

        if (
            recordarSesion &&
            !correoGuardado.isNullOrEmpty()
        ) {

            etCorreo.setText(
                correoGuardado
            )

            cbRecordarme.isChecked = true
        }

        // ==========================================
        // CORREO ENVIADO DESDE REGISTRO
        // ==========================================

        val correoPrevio =
            intent.getStringExtra(
                "CORREO_PREVIO"
            )

        if (!correoPrevio.isNullOrEmpty()) {

            etCorreo.setText(
                correoPrevio
            )
        }

        // ==========================================
        // INICIAR SESIÓN
        // ==========================================

        btnIniciar.setOnClickListener {

            val correo =
                etCorreo.text.toString().trim()

            val pass =
                etPass.text.toString()

            if (
                correo.isEmpty() ||
                pass.isEmpty()
            ) {

                Toast.makeText(
                    this,
                    "Por favor, completa todos los campos",
                    Toast.LENGTH_LONG
                ).show()

            } else {

                val correoRegistrado =
                    preferences.getString(
                        "email",
                        ""
                    )

                val passwordRegistrada =
                    preferences.getString(
                        "password",
                        ""
                    )

                if (
                    correo == correoRegistrado &&
                    pass == passwordRegistrada
                ) {

                    // Guardar sesión
                    preferences.edit()
                        .putBoolean(
                            "is_logged_in",
                            true
                        )
                        .putBoolean(
                            "remember_session",
                            cbRecordarme.isChecked
                        )
                        .apply()

                    val nombre =
                        preferences.getString(
                            "username",
                            "Usuario"
                        )

                    Toast.makeText(
                        this,
                        "¡Bienvenido, $nombre!",
                        Toast.LENGTH_SHORT
                    ).show()

                    val intent =
                        Intent(
                            this,
                            HomeActivity::class.java
                        )

                    startActivity(intent)

                    finish()

                } else {

                    Toast.makeText(
                        this,
                        "Correo o contraseña incorrectos",
                        Toast.LENGTH_LONG
                    ).show()
                }
            }
        }

        // ==========================================
        // IR A REGISTRO
        // ==========================================

        tvIrRegistro.setOnClickListener {

            val correoEscrito =
                etCorreo.text.toString().trim()

            val intentRegistro =
                Intent(
                    this,
                    RegisterActivity::class.java
                )

            if (correoEscrito.isNotEmpty()) {

                intentRegistro.putExtra(
                    "CORREO_PREVIO",
                    correoEscrito
                )
            }

            startActivity(
                intentRegistro
            )
        }
    }

    // ==========================================
    // APLICAR TEMA
    // ==========================================

    private fun aplicarTema(
        darkMode: Boolean,
        root: ScrollView,
        container: LinearLayout,
        tvBienvenido: TextView,
        tvSubtitulo: TextView,
        tvOlvidaste: TextView,
        layoutCorreo: TextInputLayout,
        etCorreo: TextInputEditText,
        layoutPass: TextInputLayout,
        etPass: TextInputEditText,
        cbRecordarme: CheckBox,
        btnIniciar: Button,
        tvIrRegistro: TextView
    ) {

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

            // Textos
            tvBienvenido.setTextColor(
                Color.parseColor("#F1E9D2")
            )

            tvSubtitulo.setTextColor(
                Color.parseColor("#F1E9D2")
            )

            tvOlvidaste.setTextColor(
                Color.parseColor("#F1E9D2")
            )

            cbRecordarme.setTextColor(
                Color.parseColor("#F1E9D2")
            )

            tvIrRegistro.setTextColor(
                Color.parseColor("#F1E9D2")
            )

            // ======================================
            // CORREO
            // ======================================

            etCorreo.setTextColor(
                Color.parseColor("#F1E9D2")
            )

            etCorreo.setHintTextColor(
                Color.parseColor("#D8C5A8")
            )

            val colorStateListHint = ColorStateList.valueOf(Color.parseColor("#F1E9D2"))
            val colorStateListStroke = ColorStateList(
                arrayOf(intArrayOf(android.R.attr.state_focused), intArrayOf()),
                intArrayOf(Color.parseColor("#F1E9D2"), Color.parseColor("#F1E9D2"))
            )

            layoutCorreo.setBoxBackgroundColor(Color.parseColor("#614326"))
            layoutCorreo.setHintTextColor(colorStateListHint)
            layoutCorreo.setDefaultHintTextColor(colorStateListHint)
            layoutCorreo.setBoxStrokeColorStateList(colorStateListStroke)

            // ======================================
            // CONTRASEÑA
            // ======================================

            etPass.setTextColor(Color.parseColor("#F1E9D2"))
            etPass.setHintTextColor(Color.parseColor("#F1E9D2"))

            layoutPass.setBoxBackgroundColor(Color.parseColor("#614326"))
            layoutPass.setHintTextColor(colorStateListHint)
            layoutPass.setDefaultHintTextColor(colorStateListHint)
            layoutPass.setBoxStrokeColorStateList(colorStateListStroke)
            layoutPass.setEndIconTintList(colorStateListHint)

            // ======================================
            // BOTÓN
            // ======================================

            btnIniciar.backgroundTintList =
                ColorStateList.valueOf(
                    Color.parseColor("#F1E9D2")
                )

            btnIniciar.setTextColor(
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
                Color.TRANSPARENT
            )

            // Textos
            tvBienvenido.setTextColor(
                Color.parseColor("#3E2723")
            )

            tvSubtitulo.setTextColor(
                Color.parseColor("#4D311B")
            )

            tvOlvidaste.setTextColor(
                Color.parseColor("#4D311B")
            )

            cbRecordarme.setTextColor(
                Color.parseColor("#4D311B")
            )

            tvIrRegistro.setTextColor(
                Color.parseColor("#4D311B")
            )

            // ======================================
            // CORREO
            // ======================================

            etCorreo.setTextColor(
                Color.parseColor("#4D311B")
            )

            etCorreo.setHintTextColor(
                Color.parseColor("#795548")
            )

            layoutCorreo.setBoxBackgroundColor(
                Color.TRANSPARENT
            )

            layoutCorreo.setHintTextColor(
                ColorStateList.valueOf(
                    Color.parseColor("#795548")
                )
            )

            layoutCorreo.setDefaultHintTextColor(
                ColorStateList.valueOf(
                    Color.parseColor("#795548")
                )
            )

            layoutCorreo.setBoxStrokeColor(
                Color.parseColor("#795548")
            )

            // ======================================
            // CONTRASEÑA
            // ======================================

            etPass.setTextColor(
                Color.parseColor("#4D311B")
            )

            etPass.setHintTextColor(
                Color.parseColor("#795548")
            )

            layoutPass.setBoxBackgroundColor(
                Color.TRANSPARENT
            )

            layoutPass.setHintTextColor(
                ColorStateList.valueOf(
                    Color.parseColor("#795548")
                )
            )

            layoutPass.setDefaultHintTextColor(
                ColorStateList.valueOf(
                    Color.parseColor("#795548")
                )
            )

            layoutPass.setBoxStrokeColor(
                Color.parseColor("#795548")
            )

            layoutPass.setEndIconTintList(
                ColorStateList.valueOf(
                    Color.parseColor("#4D311B")
                )
            )

            // ======================================
            // BOTÓN
            // ======================================

            btnIniciar.backgroundTintList =
                ColorStateList.valueOf(
                    Color.parseColor("#4D311B")
                )

            btnIniciar.setTextColor(
                Color.parseColor("#F1E9D2")
            )
        }
    }
}