"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/register/', include('register.urls')),
    path('api/note/',include('notes.urls')),
    path('api/login/', include('login.urls')),
    path('api/projectDashboard/', include('project_Dashboard.urls')),
    path('api/summarize-pdf/', include('summarizer.urls')),
    path('api/price_finder/', include('price_finder.urls')),
    path("api/feedback_analysis/", include("feedback_analysis.urls")),
    
]
