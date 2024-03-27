<template>
    <div class="citypage">
        <div class="center">
            <el-card style="width: 45vw" shadow="hover">
                <template #header>
                    <span>{{ GaoDe.cityInfo }}</span>
                    <span>{{ GaoDe.LocalWeatherInfo.weather }} {{ GaoDe.LocalWeatherInfo.temperature }}℃
                        {{ GaoDe.LocalWeatherInfo.winddirection }}风{{ GaoDe.LocalWeatherInfo.windpower }}级</span>
                </template>
                <div class="weather" v-for="weather in GaoDe.WeatherList" :key="weather.date">
                    <span>{{ weather.week }}</span>
                    <span>{{ weather.date }}</span>
                    <span>{{ weather.dayweather }}</span>
                    <span>{{ weather.daytemp }}/{{ weather.nighttemp }}℃</span>
                </div>
            </el-card>
        </div>
        <div class="content center">
            <el-row>
                <el-col :span="24">
                    <p class="style1">定位/最近访问</p>
                </el-col>
            </el-row>
            <el-row :gutter="20">
                <el-col :span="6" class="style2">
                    <el-button @click="ToHome"><el-icon>
                            <Location />
                        </el-icon>{{ GaoDe.LocalCity }}</el-button>
                </el-col>
                <el-col :span="6" v-for="visitcity in cityList.visit_city" :key="visitcity.id" class="style2">
                    <el-button @click="selectCity(visitcity.city)">{{ visitcity.city }}</el-button>
                </el-col>
            </el-row>
            <el-row>
                <el-col :span="24">
                    <p class="style1">热门城市</p>
                </el-col>
            </el-row>
            <el-row :gutter="20">
                <el-col :span="6" v-for="hotcity in cityStore.HotCities" :key="hotcity.id" class="style2">
                    <el-button @click="selectCity(hotcity.text)">{{ hotcity.text }}</el-button>
                </el-col>
            </el-row>
            <div class="layout">
                <div class="citylist">
                    <div v-for="(group, letter) in cityList.groupCities" :key="letter">
                        <el-row :gutter="20">
                            <el-col :span="24">
                                <div class="letter" :id="`letter-${letter}`">{{ letter }}</div>
                            </el-col>
                            <el-col :span="24" v-for="city in group" :key="city.id">
                                <p class="style3" @click="selectCity(city.city)">{{ city.city }}</p>
                            </el-col>
                        </el-row>
                    </div>
                </div>
                <div class="letter-nav">
                    <div class="letter" v-for="letter in letters" :key="letter" @click="scrollTo(letter)">{{ letter }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { onMounted, watch } from 'vue'
import { useRouter } from 'vue-router';
import { Location } from '@element-plus/icons-vue'
import { useCityStore, useCityList, useGaoDeStore } from '../stores/counter';
const cityStore = useCityStore()
const cityList = useCityList()
const route = useRouter()
const ToHome = () => {
    GaoDe.setCity(GaoDe.LocalCity)
    route.push('/')
}
const selectCity = (name) => {
    if (name !== GaoDe.LocalCity) {
        const cityIndex = cityList.city_list.findIndex(city => city.city === name)
        if (cityIndex !== -1) {
            cityList.city_list[cityIndex].visitCount++
            if (cityList.visit_city) {
                cityList.saveVisitedCities()
            }
        }
    }
    GaoDe.setCity(name)
    route.push('/')
}
const letters = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))
const scrollTo = (letter) => {
    const element = document.getElementById(`letter-${letter}`);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
    }
}
const GaoDe = useGaoDeStore()
onMounted(async () => {
    await GaoDe.getLocalWeather(GaoDe.cityInfo)
    await GaoDe.getForecastWeather(GaoDe.cityInfo)
    if (cityList.city_list.length === 0) {
        cityList.fetchCityList()
    }
    cityList.loadVisitedCities()
})
watch(() => GaoDe.cityInfo.city, async (newCity) => {
    if (newCity) {
        await GaoDe.getLocalWeather(newCity)
        await GaoDe.getForecastWeather(newCity)
    }
}, { immediate: true })
</script>

<style lang="scss" scoped>
.citypage {
    padding: 5vh;

    .el-card {
        text-align: center;

        :deep(.el-card__header) {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            border-bottom: none;
        }

        :deep(.el-card__body) {
            display: flex;
            justify-content: space-between;
        }

        .weather {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }
    }

    .content {
        margin-top: 1vh;

        .el-row {
            margin-bottom: 1rem;

            .style1 {
                padding: 0.2rem;
                background-color: #eeeeeeb9;
            }

            .style2 {
                text-align: center;
            }

            .el-button {
                width: 100%;
                padding: 0.5rem 1.5rem;
                margin-bottom: 0.5rem;
            }
        }

        .letter {
            color: rgba(96, 93, 93, 0.491)
        }

        .style3 {
            padding: 0.5rem 0;
            border-bottom: 1px solid #eeeeeea3;
            cursor: pointer;
        }

        .layout {
            display: flex;
            justify-content: space-between;

            .citylist {
                flex: 1;
            }

            .letter-nav {
                padding-left: 20px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: start;
                position: sticky;
                top: 3vh;
                z-index: 100;
                height: 600px;

                .letter {
                    cursor: pointer;
                    margin: 1px 0;
                }
            }
        }
    }
}
</style>