"""
Tests de Selenium para el frontend del invernadero.
Ejecutar con: python selenium_tests.py
Requiere: pip install selenium webdriver-manager
"""
import time
import unittest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager


class InvernaderoFrontendTests(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        options = webdriver.ChromeOptions()
        options.add_argument("--headless")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        cls.driver = webdriver.Chrome(
            service=Service(ChromeDriverManager().install()),
            options=options
        )
        cls.driver.implicitly_wait(5)

    @classmethod
    def tearDownClass(cls):
        cls.driver.quit()

    def test_home_loads(self):
        self.driver.get("http://localhost:5173")
        time.sleep(2)
        self.assertIn("Invernadero", self.driver.title or self.driver.page_source)
        print("✔ Home carga correctamente")

    def test_tipo_cultivo_page_loads(self):
        self.driver.get("http://localhost:5173")
        time.sleep(1)
        # Hacer clic en la entidad en el sidebar
        try:
            link = self.driver.find_element(By.XPATH, f"//*[contains(text(), 'TipoCultivo')]")
            link.click()
            time.sleep(1)
            print(f"✔ Página TipoCultivo carga correctamente")
        except Exception as e:
            self.fail(f"No se encontró la página TipoCultivo: {e}")

    def test_cultivo_page_loads(self):
        self.driver.get("http://localhost:5173")
        time.sleep(1)
        # Hacer clic en la entidad en el sidebar
        try:
            link = self.driver.find_element(By.XPATH, f"//*[contains(text(), 'Cultivo')]")
            link.click()
            time.sleep(1)
            print(f"✔ Página Cultivo carga correctamente")
        except Exception as e:
            self.fail(f"No se encontró la página Cultivo: {e}")

    def test_producto_page_loads(self):
        self.driver.get("http://localhost:5173")
        time.sleep(1)
        # Hacer clic en la entidad en el sidebar
        try:
            link = self.driver.find_element(By.XPATH, f"//*[contains(text(), 'Producto')]")
            link.click()
            time.sleep(1)
            print(f"✔ Página Producto carga correctamente")
        except Exception as e:
            self.fail(f"No se encontró la página Producto: {e}")

    def test_proveedor_page_loads(self):
        self.driver.get("http://localhost:5173")
        time.sleep(1)
        # Hacer clic en la entidad en el sidebar
        try:
            link = self.driver.find_element(By.XPATH, f"//*[contains(text(), 'Proveedor')]")
            link.click()
            time.sleep(1)
            print(f"✔ Página Proveedor carga correctamente")
        except Exception as e:
            self.fail(f"No se encontró la página Proveedor: {e}")

    def test_persona_page_loads(self):
        self.driver.get("http://localhost:5173")
        time.sleep(1)
        # Hacer clic en la entidad en el sidebar
        try:
            link = self.driver.find_element(By.XPATH, f"//*[contains(text(), 'Persona')]")
            link.click()
            time.sleep(1)
            print(f"✔ Página Persona carga correctamente")
        except Exception as e:
            self.fail(f"No se encontró la página Persona: {e}")


if __name__ == "__main__":
    unittest.main(verbosity=2)
