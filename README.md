# Startbucks-Map
这个项目是一个基于OpenLayers、GaoDe Web API、Vue框架、Json-Server、Element-Plus UI库以及Pinia状态管理器开发的全国星巴克地图查看应用。它旨在提供一个直观的界面，允许用户查看全国范围内、包括省、市、县级别的星巴克门店的空间分布。应用通过使用pop-up窗口来展示每个门店的相关信息，为用户提供了一种便捷的方式来获取门店详情。此外，这个应用还集成了导航功能，使得用户能够轻松地找到他们感兴趣的星巴克门店。
# 1.项目内容
![地图展示](Image/地图展示.gif "地图展示")
![地图服务](Image/地图服务.gif "地图服务")
# 2.空间数据处理
将星巴克门店数据和行政区划数据进行空间连接，添加星巴克门店数据的空间位置。
# 3.项目部署
项目 "Starbucks-Map" 主要由两个页面组成：首页（HomePage）和城市页面（CityPage），提供了一系列丰富的功能和信息。
## 3.1首页
首页由两个核心组件构成，顶部导航（TopHead）和地图视图（OpenMap）。
### 3.1.1 顶部导航
这个组件负责导航路由的切换，使用户能够轻松进入城市页面（CityPage）。它还集成了城市搜索功能，让用户可以快速找到他们感兴趣的城市并获取相关信息。
### 3.1.2 地图视图
利用OpenLayers技术，这个组件在地图上可视化展示星巴克门店的空间数据，并部署了多项组件。这为用户提供了直观的地理信息服务，增强了用户体验。
## 3.2 城市页面
城市页面为用户提供了详细的城市级别信息，包括城市天气预报、本地/最近访问过的城市列表、热门城市以及支持A-Z检索的城市列表。
### 3.2.1 城市天气预报
展示所选城市的当前天气状况，让用户了解前往目的地的最佳时机。
### 3.2.2 本次/最近访问城市
方便用户快速回顾和访问他们之前感兴趣的或当前所在的城市。
### 3.2.3 热门城市和A-Z城市检索
提供一个全面的城市列表，通过热门城市快速导航或使用A-Z检索功能找到特定城市。
# 4.项目核心功能讲解
## 4.1 A-Z城市检索
本项目采用Element-Plus Layout进行快速布局设计，创建一个直观和用户友好的界面。通过axios读取demo.geojson文件，解析各个城市的名称，进一步通过pin-yin库提取每个城市名称的首字母。特别注意到“重庆市”作为一个多音字例外，并为其单独设定了处理规则。
接着，按照城市名称的首字母对城市进行了分组，创建了一个清晰的城市列表视图。每个城市旁边，设计并实现了一个列表，用户点击后即可实现到对应城市的页面跳转。使用户能够更快地找到并访问他们感兴趣的城市信息。其中利用css粘性定位使得字母索引在搜索过程中始终保持一个固定位置。
```
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
<style>
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
</style>
<script>
<script>
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
</script>

</script>
```
```
export const useCityList = defineStore('citylist', () => {
  //用于存储解析后的城市列表数据，每个城市信息包括其ID、首字母、城市名和访问次数。
  const city_list = ref([]);
  //存储用户访问过的城市列表，用于显示最近访问的城市。
  const visit_city = ref([]);
  //多音字城市的手动映射
  const polyphonicCities = {
    '重庆市': 'C',
  }
  async function fetchCityList() {
    const url = '/市.geojson';
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
    //将访问次数大于0的城市保存到localStorage中，用于持久化用户的访问历史。
    const visitedCities = city_list.value.filter(city => city.visitCount > 0)
    localStorage.setItem('visitedCities', JSON.stringify(visitedCities))
  }
  //从localStorage中加载访问过的城市列表，并根据访问次数和首字母进行排序，最后更新visit_city状态以显示最多5个最近访问的城市。
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
```
## 4.2 地图展示
用户检索的城市信息被存储在CityInfo状态中。通过Vue对这个状态进行监听，一旦检测到其中的信息发生变化，即触发地图的重新渲染过程。在渲染过程中，通过计算矢量图层的范围，确保所选城市能够在地图上居中显示。
```
<script>
    watch(() => GaoDe.cityInfo, (newCityInfo) => {
        if (newCityInfo) {
            MapStore.fetchCityData(newCityInfo).then(() => {
                MapStore.mapData(map.value, MapStore.cityGeoJSON, MapStore.starbucksGeoJSON, MapStore.unstarbucksGeoJSON, true);
            });
        }
    }, { immediate: true, });
</script>
```
```
    //计算矢量图层范围
    const extent = boundarySource.getExtent();
    map.addLayer(boundaryLayer);
    map.addLayer(starbucksLayer);
    map.addLayer(unstarbucksLayer);
    //判断是否需要居中显示，后续触发点击事件不需要地图重新居中
    if (isextend) {
        map.getView().fit(extent, { duration: 1500, padding: [50, 50, 50, 50] });
    }
```
## 4.3 门店信息查看
基于OpenLayers Popup对得到焦点的星巴克门店数据进行信息查看。
```
//设置showDialog计算属性，失去焦点后信息框不再渲染。
<div v-if="showDialog" class="map-popup"
    //设置Popup信息框的定位，使其位于星巴克门店图层的上方
    :style="{ position: 'absolute', left: `${popupPosition.x}px`, top: `${popupPosition.y}px` }"
    v-html="tooltipContent">
</div>
<script>
    //给地图设置焦点事件
    map.value.on('pointermove', (e) => {
        let featureFound = false;
        //检索星巴克门店图层
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
</script>
```
## 4.4 标记了一处星巴克门店
基于Json-Server将双击的星巴克门店进行标记
```
//跨域请求
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000', 
        changeOrigin: true, 
        rewrite: (path) => path.replace(/^\/api/, ''), 
      },
    },
  },
```
```
<script>
    map.value.on('dblclick', (e) => {
        //组织地图放大事件
        e.preventDefault();
        map.value.forEachFeatureAtPixel(e.pixel, (feature) => {
            if (feature.getGeometry().getType() === 'Point') {
                const properties = feature.getProperties();
                //设置updatecontent，将对象数据通过json-server写入后端星巴克门店数据
                const updatecontent = {
                    "id": properties.id,
                    "开始时间": properties.开始时间,
                    "休息时间": properties.休息时间,
                    "门店名": properties.门店名,
                    "Discover": "True",
                    "省": properties.省,
                    "市": properties.市,
                    "县": properties.县
                };
                //为星巴克门店数据添加id，使json-server可以读取该数据
                axios.patch(`http://localhost:3000/features/${properties.id}`, { properties: updatecontent }).then(() => {
                    MapStore.fetchCityData(GaoDe.cityInfo).then(() => {
                        //此时不再重现计算图层的范围对其居中显示
                        MapStore.mapData(map.value, MapStore.cityGeoJSON, MapStore.starbucksGeoJSON, MapStore.unstarbucksGeoJSON, false);
                    });
                })
            }
        })
    })
</script>
```
## 4.5 地图导航
基于Gao De Web API设计起始点和目的地的导航。首先，利用高德Web API中的AMap.Driving服务插件，根据用户指定的起始点和目的地，请求获取驾车导航的路线数据。AMap.Driving插件通过算法优化，为用户提供了最佳的行驶路线，包括必要的转弯、经过的道路等详细信息。获取到的路径数据默认格式适用于高德地图，为了在OpenLayers中使用这些数据，需要将其转换成OL能够理解的GeoJSON格式，最后，利用OpenLayers提供的功能，在地图上绘制出导航路线。
```
  //启动Amap.Driving服务
  <script type="text/javascript">
    window._AMapSecurityConfig = {
      securityJsCode: 'your Web securityJsCode',
    }
  </script>
  <script type="text/javascript"
    src="https://webapi.amap.com/maps?v=2.0&key=your Web Key&plugin=AMap.Driving"></script>
```
```
<div class="nav-inputs">
    <el-input v-model="startpointname" style="width: 15vw" placeholder="输入起点" @click="selectSPoint" clearable
        readonly />
    <el-input v-model="endpointname" style="width: 15vw" placeholder="输入终点" @click="selectEPoint" clearable readonly />
    <el-button round @click="nav" style="width: 5vw" :disabled="isDisabled">导航</el-button>
</div>
<script>
    const selectSPoint = () => {
        selectmode.value = "start"
        select(selectmode.value)
    }
    const selectEPoint = () => {
        selectmode.value = "end"
        select(selectmode.value)
    }
    //设置事件管理器，防治起点和终点输入均触发
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
    //计算属性，防治误触导航按钮
    const isDisabled = computed(() => {
        return startpointname.value === '' || endpointname.value === '';
    });
    const nav = () => {
        //移除上条导航信息
        MapStore.removeLineLayers(map.value)
        startpointname.value = ''
        endpointname.value = ''
        //重构Amap Driving插件
        var driving = new AMap.Driving();
        var lineStyle = new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: '#007bff',
                width: 4
            })
        });
        var route;
        //存储路径信息
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
                var lineFeature = new ol.Feature({
                    geometry: new ol.geom.LineString(routeCoordinates)
                });
                var lineSource = new ol.source.Vector({
                    features: [lineFeature]
                });
                var lineLayer = new ol.layer.Vector({
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
</script>
```
## 4.6 线上部署
本次使用云服务器使用nginx对本地项目进行部署
## 4.6.1 打包项目
获取dist目录
```
npm run build
```
## 4.6.2 安装Xshell和Xftp
用于云服务器管理和文件传输。
## 4.6.3 安装nginx
云服务器安装nginx，用于静态网页线上部署。
```
sudo apt update
sudo apt install nginx
```
## 4.6.4 配置nginx
```
//创建新的Nginx配置文件
sudo nano /etc/nginx/sites-available/startbucksmap.conf
//编辑nano文件
server {
    listen 80;
    server_name your ip;

    root your root;

    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

}
//启动站点
sudo ln -s /etc/nginx/sites-available/starbucksmap.conf /etc/nginx/sites-enabled/
//检查nginx配置
sudo nginx -t
//重新加载nginx
sudo systemctl reload nginx
```
# 5.线上地址
该项目目前在展示方面遇到性能瓶颈，主要原因是geojson数据尚未进行分块处理。后续计划在不久的将来对数据进行优化，以提升用户体验。此次优化将专注于数据处理效率，而不会影响现有逻辑架构。[startbucksmap](http://43.139.219.105/)
