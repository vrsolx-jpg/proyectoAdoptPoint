package com.example.proyecto

import android.content.Context
import android.content.Intent
import android.content.res.ColorStateList
import android.graphics.Color
import android.os.Bundle
import android.util.Log
import android.widget.Button
import android.widget.Switch
import android.widget.TextView
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat

class HomeActivity : AppCompatActivity() {

    private lateinit var preferences: android.content.SharedPreferences

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        enableEdgeToEdge()

        setContentView(R.layout.activity_home)

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
        // CONTADOR DE APERTURAS
        // ==========================================

        val currentLaunches =
            preferences.getInt("launch_count", 0) + 1

        preferences.edit()
            .putInt("launch_count", currentLaunches)
            .apply()

        // El usuario no ve el contador.
        // Nosotros lo podemos comprobar en Logcat.
        Log.d(
            "ADOPT_POINT",
            "Número de aperturas: $currentLaunches"
        )

        // ==========================================
        // REFERENCIAS DE LA INTERFAZ
        // ==========================================

        val tvWelcome =
            findViewById<TextView>(R.id.tvWelcome)

        val tvSubtitle =
            findViewById<TextView>(R.id.tvSubtitle)

        val swDarkMode =
            findViewById<Switch>(R.id.swDarkMode)

        val btnHomeLogin =
            findViewById<Button>(R.id.btnHomeLogin)

        val btnHomeRegistro =
            findViewById<Button>(R.id.btnHomeRegistro)

        // ==========================================
        // RECUPERAR MODO OSCURO
        // ==========================================

        val darkMode =
            preferences.getBoolean(
                "dark_mode",
                false
            )

        // Colocar el Switch según el estado guardado
        swDarkMode.isChecked = darkMode

        // Aplicar el tema guardado
        aplicarTema(
            darkMode,
            tvWelcome,
            tvSubtitle,
            swDarkMode,
            btnHomeLogin,
            btnHomeRegistro
        )

        // ==========================================
        // CAMBIAR MODO OSCURO
        // ==========================================

        swDarkMode.setOnCheckedChangeListener { _, isChecked ->

            // Guardar el estado
            preferences.edit()
                .putBoolean(
                    "dark_mode",
                    isChecked
                )
                .apply()

            // Aplicar el nuevo tema
            aplicarTema(
                isChecked,
                tvWelcome,
                tvSubtitle,
                swDarkMode,
                btnHomeLogin,
                btnHomeRegistro
            )
        }

        // ==========================================
        // BOTÓN INICIAR SESIÓN
        // ==========================================

        btnHomeLogin.setOnClickListener {

            val intent =
                Intent(
                    this,
                    LoginActivity::class.java
                )

            intent.putExtra(
                "MENSAJE_BIENVENIDA",
                "¡Hola! Ingresa tus datos"
            )

            startActivity(intent)
        }

        // ==========================================
        // BOTÓN REGISTRO
        // ==========================================

        btnHomeRegistro.setOnClickListener {

            val intent =
                Intent(
                    this,
                    RegisterActivity::class.java
                )

            startActivity(intent)
        }
    }

    // ==========================================
    // APLICAR TEMA
    // ==========================================

    private fun aplicarTema(
        darkMode: Boolean,
        tvWelcome: TextView,
        tvSubtitle: TextView,
        swDarkMode: Switch,
        btnHomeLogin: Button,
        btnHomeRegistro: Button
    ) {

        val root =
            findViewById<android.view.View>(R.id.main)

        if (darkMode) {

            // ======================================
            // MODO OSCURO
            // ======================================

            // Fondo principal
            root.setBackgroundColor(
                Color.parseColor("#4D311B")
            )

            // Título
            tvWelcome.setTextColor(
                Color.parseColor("#F1E9D2")
            )

            // Subtítulo
            tvSubtitle.setTextColor(
                Color.parseColor("#F1E9D2")
            )

            // Texto del Switch
            swDarkMode.setTextColor(
                Color.parseColor("#F1E9D2")
            )

            // Botón Iniciar Sesión
            btnHomeLogin.backgroundTintList =
                ColorStateList.valueOf(
                    Color.parseColor("#F1E9D2")
                )

            btnHomeLogin.setTextColor(
                Color.parseColor("#4D311B")
            )

            // Botón Registrarse
            btnHomeRegistro.backgroundTintList =
                ColorStateList.valueOf(
                    Color.parseColor("#F1E9D2")
                )

            btnHomeRegistro.setTextColor(
                Color.parseColor("#4D311B")
            )

        } else {

            // ======================================
            // MODO CLARO
            // ======================================

            // Fondo principal
            root.setBackgroundColor(
                Color.parseColor("#F1E9D2")
            )

            // Título
            tvWelcome.setTextColor(
                Color.parseColor("#4D311B")
            )

            // Subtítulo
            tvSubtitle.setTextColor(
                Color.parseColor("#4D311B")
            )

            // Texto del Switch
            swDarkMode.setTextColor(
                Color.parseColor("#4D311B")
            )

            // Botón Iniciar Sesión
            btnHomeLogin.backgroundTintList =
                ColorStateList.valueOf(
                    Color.parseColor("#4D311B")
                )

            btnHomeLogin.setTextColor(
                Color.parseColor("#F1E9D2")
            )

            // Botón Registrarse
            btnHomeRegistro.backgroundTintList =
                ColorStateList.valueOf(
                    Color.parseColor("#8D6E63")
                )

            btnHomeRegistro.setTextColor(
                Color.WHITE
            )
        }
    }
}