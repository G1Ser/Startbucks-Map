<template>
    <div class="tophead">
        <el-menu mode="horizontal" background-color="#a9cbfe" text-color="#fff" active-text-color="#4264fb">
            <el-menu-item index="1" @click="handleRouter" style="width: 10vw;">{{ GaoDe.cityInfo }}<el-icon>
                    <Location />
                </el-icon></el-menu-item>
            <el-menu-item index="2"><el-input v-model="input" @keyup.enter="handleInput" style="width: 40vw"
                    size="large" placeholder="Please Input" :prefix-icon="Search" /></el-menu-item>
            <el-menu-item index="3" class="menu-item-right">{{ MapStore.discover }}/{{ MapStore.amount }}</el-menu-item>
        </el-menu>
    </div>
</template>

<script setup>
import { Location, Search } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router';
import { useCityList, useGaoDeStore, useMapStore } from '@/stores/counter'
import { ref, onMounted } from 'vue';
const route = useRouter()
const handleRouter = () => {
    route.push('/city')
}
const cityList = useCityList()
const GaoDe = useGaoDeStore()
const MapStore = useMapStore()
const input = ref('')
const handleInput = () => {
    MapStore.fetchCityData(input.value).then(() => {
        if (MapStore.city_name !== GaoDe.LocalCity) {
            const cityIndex = cityList.city_list.findIndex(city => city.city === MapStore.city_name)
            if (cityIndex !== -1) {
                cityList.city_list[cityIndex].visitCount++
                if (cityList.visit_city) {
                    cityList.saveVisitedCities()
                }
            }
        }
        GaoDe.setCity(MapStore.city_name)
        input.value = ''
    })
};
onMounted(async () => {
    if (!GaoDe.cityInfo) {
        await GaoDe.getLocallocation()
    }
})
</script>

<style lang="scss" scoped>
.tophead {
    width: 100vw;
    height: 10vh;
    font-size: 1.2vw;

    .el-menu {
        display: flex;
        justify-content: start;
        font-size: inherit;
        height: 10vh;

        .menu-item-right {
            width: 10vw;
            margin-left: 30vw;
        }

        :deep(.el-menu-item),
        el-icon,
        el-input {
            display: flex;
            align-items: center;
            font-size: inherit;
            border-bottom: none;
        }
    }
}
</style>