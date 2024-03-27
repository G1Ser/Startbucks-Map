import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'
import pinyin from 'tiny-pinyin'
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Style from 'ol/style/Style';
import Stroke from 'ol/style/Stroke';
import Circle from 'ol/style/Circle';
import GeoJSON from 'ol/format/GeoJSON';
export const useCityStore = defineStore('hotcity', () => {
  const HotCities = ref([
    { id: 1, text: '杭州市' },
    { id: 2, text: '北京市' },
    { id: 3, text: '上海市' },
    { id: 4, text: '广州市' },
    { id: 5, text: '深圳市' },
    { id: 6, text: '成都市' },
    { id: 7, text: '重庆市' },
    { id: 8, text: '天津市' },
    { id: 9, text: '南京市' },
    { id: 10, text: '苏州市' },
    { id: 11, text: '武汉市' },
    { id: 12, text: '西安市' }
  ])
  return { HotCities }
})
export const useCityList = defineStore('citylist', () => {
  const city_list = ref([]);
  const visit_city = ref([]);
  //多音字城市的手动映射
  const polyphonicCities = {
    '重庆市': 'C',
  }
  async function fetchCityList() {
    const url = '/市demo.geojson';
    try {
      const response = await axios.get(url);
      const features = response.data.features;
      //尝试从本次存储获取已经存在的城市列表数据
      const visitedCityList = localStorage.getItem('visitedCities');
      const visitedCities = visitedCityList ? JSON.parse(visitedCityList) : [];
      //构建新数组
      let cities = features.map((feature, index) => {
        const city = feature.properties.市;
        let firstLetter = '#';
        // 尝试找到当前城市在已访问城市列表中的记录
        const visitedCity = visitedCities.find(City => City.city === city);
        let visitCount = visitedCity ? visitedCity.visitCount : 0;
        if (polyphonicCities[city]) {
          firstLetter = polyphonicCities[city];
        } else if (pinyin.isSupported()) {
          firstLetter = pinyin.convertToPinyin(city, '', true).charAt(0).toUpperCase();
        }
        return { id: index + 1, firstLetter, city, visitCount };
      }).sort((a, b) => a.firstLetter.localeCompare(b.firstLetter));
      city_list.value = cities
    } catch (error) {
      console.error(error)
    }
  }
  const saveVisitedCities = () => {
    //筛选出访问次数大于0的城市
    const visitedCities = city_list.value.filter(city => city.visitCount > 0)
    localStorage.setItem('visitedCities', JSON.stringify(visitedCities))
  }
  const loadVisitedCities = () => {
    const visitedCityList = localStorage.getItem('visitedCities');
    if (visitedCityList) {
      let visitedCities = JSON.parse(visitedCityList)
      visitedCities.sort((a, b) => {
        if (a.visitCount === b.visitCount) {
          return a.firstLetter.localeCompare(b.firstLetter)
        }
        return b.visitCount - a.visitCount
      })
      visit_city.value = visitedCities.slice(0, 5)
    }
  }
  //计算属性，用于分组城市
  const groupCities = computed(() => {
    return city_list.value.reduce((groups, city) => {
      const { firstLetter } = city;
      if (!groups[firstLetter]) {
        groups[firstLetter] = [];
      }
      groups[firstLetter].push(city);
      return groups;
    }, {});
  });
  return { fetchCityList, saveVisitedCities, loadVisitedCities, city_list, visit_city, groupCities }
})
export const useGaoDeStore = defineStore('GaoDe', () => {
  const key = ref('your key')
  const cityInfo = ref(null)
  const LocalCity = ref(null)
  const getLocallocation = async () => {
    try {
      const res = await axios.get(`https://restapi.amap.com/v3/ip?key=${key.value}`)
      cityInfo.value = res.data.city
      LocalCity.value = res.data.city
    } catch (error) {
      console.error(error)
    }
  }
  const setCity = (newCity) => {
    cityInfo.value = newCity
  }
  const LocalWeatherInfo = ref({ weather: '', temperature: '', winddirection: '', windpower: '' })
  const getLocalWeather = async (city) => {
    const res = await axios.get(`https://restapi.amap.com/v3/weather/weatherInfo?city=${city}&key=${key.value}&extensions=base`)
    LocalWeatherInfo.value = {
      weather: res.data.lives[0].weather,
      temperature: res.data.lives[0].temperature,
      winddirection: res.data.lives[0].winddirection,
      windpower: res.data.lives[0].windpower
    }
  }
  const WeatherList = ref(null)
  function formatcasts(casts) {
    const today = new Date();
    const tomorrow = new Date();
    const currentHour = today.getHours()
    tomorrow.setDate(today.getDate() + 1);
    const weekDays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"]
    casts.forEach(cast => {
      //格式化week
      const castDate = new Date(cast.date);
      if (castDate.toDateString() === today.toDateString()) {
        cast.week = "今天";
      } else if (castDate.toDateString() === tomorrow.toDateString()) {
        cast.week = "明天";
      } else {
        cast.week = weekDays[castDate.getDay()];
      }
      //格式化date
      const date = cast.date.split('-');
      cast.date = date[1] + '-' + date[2];
    })
    return casts
  }
  const getForecastWeather = async (city) => {
    const res = await axios.get(`https://restapi.amap.com/v3/weather/weatherInfo?city=${city}&key=${key.value}&extensions=all`)
    const forecasts = res.data.forecasts[0].casts
    WeatherList.value = formatcasts(forecasts)
  }
  return { LocalCity, cityInfo, getLocallocation, setCity, LocalWeatherInfo, getLocalWeather, WeatherList, getForecastWeather }
})
export const useMapStore = defineStore('Map', () => {
  const province_url = '/省demo.geojson';
  const city_url = '/市demo.geojson';
  const county_url = '/县demo.geojson';
  const starbuck_url = '/星巴克数据demo.geojson';
  const cityGeoJSON = ref({ type: '', crs: '', features: '' })
  const starbucksGeoJSON = ref({ type: '', crs: '', features: '' })
  const unstarbucksGeoJSON = ref({ type: '', crs: '', features: '' })
  const city_name = ref(null)
  const amount = ref()
  const discover = ref()
  async function fetchCityData(city) {
    try {
      const geo_province = await axios.get(province_url);
      const province_data = geo_province.data.features.filter(feature => feature.properties.省.startsWith(city));
      try {
        city_name.value = province_data[0].properties.省;
      } catch (error) {
        city_name.value = null;
      }
      if (city_name.value) {
        const geo_starbucks = await axios.get(starbuck_url);
        const starbucks_data = geo_starbucks.data.features.filter(feature => feature.properties.省.startsWith(city));
        const discover_data = starbucks_data.filter(feature => feature.properties.Discover === "True")
        const undiscover_data = starbucks_data.filter(feature => feature.properties.Discover === "False")
        discover.value = discover_data.length
        amount.value = starbucks_data.length
        cityGeoJSON.value = {
          type: "FeatureCollection",
          crs: { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
          features: province_data
        }
        unstarbucksGeoJSON.value = {
          "type": "FeatureCollection",
          "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
          features: undiscover_data
        }
        starbucksGeoJSON.value = {
          "type": "FeatureCollection",
          "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
          features: discover_data
        }
      } else {
        const geo_city = await axios.get(city_url);
        const city_data = geo_city.data.features.filter(feature => feature.properties.市.startsWith(city));
        try {
          city_name.value = city_data[0].properties.市;
        } catch (error) {
          city_name.value = null;
        }
        if (city_name.value) {
          const geo_starbucks = await axios.get(starbuck_url);
          const starbucks_data = geo_starbucks.data.features.filter(feature => feature.properties.市.startsWith(city));
          const undiscover_data = starbucks_data.filter(feature => feature.properties.Discover === "False")
          const discover_data = starbucks_data.filter(feature => feature.properties.Discover === "True")
          discover.value = discover_data.length
          amount.value = starbucks_data.length
          cityGeoJSON.value = {
            type: "FeatureCollection",
            crs: { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
            features: city_data
          }
          unstarbucksGeoJSON.value = {
            "type": "FeatureCollection",
            "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
            features: undiscover_data
          }
          starbucksGeoJSON.value = {
            "type": "FeatureCollection",
            "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
            features: discover_data
          }
        } else {
          const geo_county = await axios.get(county_url);
          const county_data = geo_county.data.features.filter(feature => feature.properties.县.startsWith(city));
          try {
            city_name.value = county_data[0].properties.县;
          } catch (error) {
            city_name.value = null;
          }
          if (city_name.value) {
            const geo_starbucks = await axios.get(starbuck_url);
            const starbucks_data = geo_starbucks.data.features.filter(feature => feature.properties.县.startsWith(city));
            const discover_data = starbucks_data.filter(feature => feature.properties.Discover === "True")
            const undiscover_data = starbucks_data.filter(feature => feature.properties.Discover === "False")
            discover.value = discover_data.length
            amount.value = starbucks_data.length
            cityGeoJSON.value = {
              type: "FeatureCollection",
              crs: { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
              features: county_data
            }
            unstarbucksGeoJSON.value = {
              "type": "FeatureCollection",
              "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
              features: undiscover_data
            }
            starbucksGeoJSON.value = {
              "type": "FeatureCollection",
              "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
              features: discover_data
            }
          }
        }
      }
    } catch (error) {
      console.error(error)
    }
  }
  function removeAllLayersExceptBase(map) {
    let layersToRemove = [];
    map.getLayers().forEach(layer => {
      if (!(layer instanceof TileLayer)) {
        layersToRemove.push(layer);
      }
    });

    layersToRemove.forEach(layer => {
      map.removeLayer(layer);
    });
  }
  function removeLineLayers(map) {
    let layersToRemove = [];
    map.getLayers().forEach(layer => {
      if (layer.get('isLineLayer')) {
        layersToRemove.push(layer);
      }
    });
    layersToRemove.forEach(layer => {
      map.removeLayer(layer);
    });
  }
  function mapData(map, boundaryJSON, starbucksJSON, unstarbucksJSON, isextend) {
    removeAllLayersExceptBase(map);
    // 定义样式
    const boundaryStyle = new Style({
      stroke: new Stroke({
        color: 'red', // 边框颜色
        width: 2 // 边框宽度
      })
    });
    const starbucksStyle = new Style({
      image: new Circle({
        radius: 5,
        stroke: new Stroke({ color: 'blue', width: 2 })
      })
    });
    const unstarbucksStyle = new Style({
      image: new Circle({
        radius: 5,
        stroke: new Stroke({ color: 'green', width: 1 })
      })
    });
    var boundaryFeatures = new GeoJSON().readFeatures(boundaryJSON);
    var starbucksFeatures = new GeoJSON().readFeatures(starbucksJSON);
    var unstarbucksFeatures = new GeoJSON().readFeatures(unstarbucksJSON);
    var boundarySource = new VectorSource({
      features: boundaryFeatures
    });
    var starbucksSource = new VectorSource({
      features: starbucksFeatures
    });
    var unstarbucksSource = new VectorSource({
      features: unstarbucksFeatures
    })
    var boundaryLayer = new VectorLayer({
      source: boundarySource,
      style: boundaryStyle
    });
    var starbucksLayer = new VectorLayer({
      source: starbucksSource,
      style: starbucksStyle
    });
    var unstarbucksLayer = new VectorLayer({
      source: unstarbucksSource,
      style: unstarbucksStyle
    })
    const extent = boundarySource.getExtent();
    map.addLayer(boundaryLayer);
    map.addLayer(starbucksLayer);
    map.addLayer(unstarbucksLayer);
    if (isextend) {
      map.getView().fit(extent, { duration: 1500, padding: [50, 50, 50, 50] });
    }
  }
  return { city_name, amount, discover, cityGeoJSON, starbucksGeoJSON, unstarbucksGeoJSON, fetchCityData, removeLineLayers, mapData }
})
