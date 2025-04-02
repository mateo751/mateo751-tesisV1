from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed

""" Que es la autenticación?
    La autenticación es el proceso de verificar la identidad de un usuario.
    En Django, la autenticación se utiliza para verificar la identidad de un usuario.
"""
#Autenticación de usuarios con cookies
class CookiesJWTAuthentication(JWTAuthentication):
    def authenticate(self, request): #Método para autenticar el usuario
        access_token = request.COOKIES.get('access_token')#Obtener el token de acceso de las cookies
        if not access_token:
            return None
        validated_token = self.get_validated_token(access_token)#Validar el token de acceso
        try:
            user = self.get_user(validated_token)#Obtener el usuario autenticado
        except AuthenticationFailed:
            return None
        return user, validated_token
