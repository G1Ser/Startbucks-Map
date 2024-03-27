<template>
    <div id="map">
        <div class="buttons"><el-button round @click="toggleMap">切换地图</el-button><el-button round
                @click="toLocal">复位</el-button></div>
        <div class="nav-inputs">
            <el-input v-model="startpointname" style="width: 15vw" placeholder="输入起点" @click="selectSPoint" clearable
                readonly />
            <el-input v-model="endpointname" style="width: 15vw" placeholder="输入终点" @click="selectEPoint" clearable
                readonly />
            <el-button round @click="nav" style="width: 5vw" :disabled="isDisabled">导航</el-button>
        </div>
    </div>
    <!-- 信息弹窗部分 -->
    <div v-if="showDialog" class="map-popup"
        :style="{ position: 'absolute', left: `${popupPosition.x}px`, top: `${popupPosition.y}px` }"
        v-html="tooltipContent">
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { useGaoDeStore, useMapStore } from '@/stores/counter'
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import LineString from 'ol/geom/LineString';
import Style from 'ol/style/Style';
import Stroke from 'ol/style/Stroke';
var vector_map = new TileLayer({
    source: new XYZ({
        url: 'https://webst02.is.autonavi.com/appmaptile?style=9&x={x}&y={y}&z={z}&ltype=11'
    })
});
var image_map = new TileLayer({
    source: new XYZ({
        url: 'https://webst02.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}&ltype=11'
    })
});
const GaoDe = useGaoDeStore()
const MapStore = useMapStore()
const map = ref(null)
const showDialog = ref(false)
const tooltipContent = ref('')
const popupPosition = reactive({ x: 0, y: 0 });
const isVectorMapVisible = ref(true);
const startpointname = ref('')
const startpoint = ref('')
const endpointname = ref('')
const endpoint = ref('')
const selectmode = ref('')
const toggleMap = () => {
    if (isVectorMapVisible.value) {
        vector_map.setOpacity(0);
        image_map.setOpacity(1);
    } else {
        vector_map.setOpacity(1);
        image_map.setOpacity(0);
    }
    isVectorMapVisible.value = !isVectorMapVisible.value;
}
const toLocal = () => {
    GaoDe.cityInfo = GaoDe.LocalCity
}
const selectSPoint = () => {
    selectmode.value = "start"
    select(selectmode.value)
}
const selectEPoint = () => {
    selectmode.value = "end"
    select(selectmode.value)
}
let clickListener;
function select(selectmode) {
    if (clickListener) {
        map.value.un('click', clickListener);
    }
    clickListener = (e) => {
        map.value.forEachFeatureAtPixel(e.pixel, (feature) => {
            if (feature.getGeometry().getType() === 'Point') {
                const properties = feature.getProperties();
                const geometry = feature.getGeometry();
                const coordinates = geometry.getCoordinates();
                if (selectmode === "start") {
                    startpointname.value = properties.门店名;
                    startpoint.value = coordinates
                } else if (selectmode === "end") {
                    endpointname.value = properties.门店名;
                    endpoint.value = coordinates
                }
            }
        })
    }
    map.value.on('click', clickListener);
}
const isDisabled = computed(() => {
    return startpointname.value === '' || endpointname.value === '';
});
const nav = () => {
    MapStore.removeLineLayers(map.value)
    startpointname.value = ''
    endpointname.value = ''
    var driving = new AMap.Driving();
    var lineStyle = new Style({
        stroke: new Stroke({
            color: '#007bff',
            width: 4
        })
    });
    var route;
    var routeCoordinates = [];
    function fetchroute(startLngLat, endLngLat) {
        return new Promise((resolve, reject) => {
            driving.search(startLngLat, endLngLat, function (status, result) {
                if (status === 'complete') {
                    resolve(result.routes); // 使用resolve返回成功的结果
                } else {
                    reject('获取驾车数据失败：' + result); // 使用reject返回失败的原因
                }
            });
        });
    }
    fetchroute(startpoint.value, endpoint.value)
        .then(routes => {
            route = routes; // 将解析的结果赋值给外部变量route
            routeCoordinates.push(startpoint.value);
            route[0].steps.forEach((step) => {
                step.path.forEach((path) => {
                    routeCoordinates.push([path.lng, path.lat])
                })
            })
            routeCoordinates.push(endpoint.value)
            var lineFeature = new Feature({
                geometry: new LineString(routeCoordinates) // 直接使用坐标创建LineString
            });
            var lineSource = new VectorSource({
                features: [lineFeature]
            });
            var lineLayer = new VectorLayer({
                source: lineSource,
                style: lineStyle,
                isLineLayer: true
            });
            map.value.addLayer(lineLayer)
        })
        .catch(error => {
            console.error(error); // 错误处理
        });
}
onMounted(() => {
    map.value = new Map({
        target: 'map',
        layers: [vector_map, image_map],
        view: new View({
            center: [104.25, 31.75],
            zoom: 4,
            projection: 'EPSG:4326'
        })
    });
    image_map.setOpacity(0);
    map.value.on('pointermove', (e) => {
        let featureFound = false;
        map.value.forEachFeatureAtPixel(e.pixel, (feature) => {
            if (feature.getGeometry().getType() === 'Point') {
                const properties = feature.getProperties();
                tooltipContent.value = `${properties.门店名}<br>营业时间：${properties.开始时间}<br>休息时间：${properties.休息时间}`;
                showDialog.value = true; // 显示弹窗
                popupPosition.x = e.pixel[0] - 65;
                popupPosition.y = e.pixel[1] - 20;
                featureFound = true;
            }
        });
        if (!featureFound) {
            showDialog.value = false;
        }
    });
})
watch(() => GaoDe.cityInfo, (newCityInfo) => {
    if (newCityInfo) {
        MapStore.fetchCityData(newCityInfo).then(() => {
            MapStore.mapData(map.value, MapStore.cityGeoJSON, MapStore.starbucksGeoJSON, MapStore.unstarbucksGeoJSON, true);
        });
    }
}, { immediate: true, });
</script>

<style lang="scss" scoped>
#map {
    width: 100vw;
    height: 90vh;
    position: relative;

    .buttons {
        display: flex;
        position: absolute;
        top: 20px;
        left: 50px;
        z-index: 100;
    }

    .nav-inputs {
        display: flex;
        flex-direction: column;
        gap: 5px;
        position: absolute;
        top: 80px;
        left: 10px;
        z-index: 100;
        align-items: center;
    }
}

.map-popup {
    text-align: center;
    font-size: 1rem;
    background: rgba(255, 255, 255, 0.6);
    padding: 5px;
    border-radius: 10px;
}
</style>