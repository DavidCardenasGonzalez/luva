import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { useStoryDetail } from "../hooks/useStories";
import { useStoryProgress } from "../progress/StoryProgressProvider";
import { RouteProp } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, "StoryMissions">;

export default function StoryMissionsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const storyId = route.params?.storyId;
  const { story, loading, error } = useStoryDetail(storyId);
  const { isMissionCompleted, storyCompleted } = useStoryProgress();

  const { completedCount, totalMissions, progressPct } = useMemo(() => {
    if (!story) {
      return { completedCount: 0, totalMissions: 0, progressPct: 0 };
    }
    const total = story.missions.length;
    const completed = story.missions.reduce((acc, mission) => {
      return (
        acc + (isMissionCompleted(story.storyId, mission.missionId) ? 1 : 0)
      );
    }, 0);
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      completedCount: completed,
      totalMissions: total,
      progressPct: pct,
    };
  }, [isMissionCompleted, story]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0b1224",
        }}
      >
        <ActivityIndicator size="large" color="#22d3ee" />
      </View>
    );
  }

  if (error || !story) {
    return (
      <View style={{ flex: 1, padding: 16, backgroundColor: "#0b1224" }}>
        <View
          style={{
            padding: 16,
            borderRadius: 16,
            backgroundColor: "#3f1d2e",
            borderWidth: 1,
            borderColor: "#7f1d1d",
          }}
        >
          <Text style={{ color: "#fecdd3", fontWeight: "700" }}>
            {error || "No encontramos la historia solicitada."}
          </Text>
        </View>
      </View>
    );
  }

  const handleMissionPress = (index: number) => {
    navigation.navigate("StoryScene", {
      storyId: story.storyId,
      sceneIndex: index,
    });
  };

  const storyDone = storyCompleted(story.storyId);

  const nextIncompleteIndex = story.missions.findIndex(
    (mission) => !isMissionCompleted(story.storyId, mission.missionId),
  );

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: "#0b1224" }}
    >
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
        style={{ flex: 1 }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 12,
            height: 48,
            position: "relative",
          }}
        >
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: "#0f172a",
              borderWidth: 1,
              borderColor: "#1f2937",
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.9 : 1,
              shadowColor: "#000",
              shadowOpacity: 0.12,
              shadowRadius: 8,
              position: "absolute",
              left: 0,
            })}
          >
            <View
              style={{
                width: 12,
                height: 12,
                borderLeftWidth: 2,
                borderBottomWidth: 2,
                borderColor: "#e2e8f0",
                transform: [{ rotate: "45deg" }],
              }}
            />
          </Pressable>
          <Image
            source={require("../image/logo.png")}
            style={{ width: 180, height: 42, resizeMode: "contain" }}
          />
        </View>

        <View
          style={{
            borderRadius: 24,
            overflow: "hidden",
            padding: 20,
            backgroundColor: "#0f172a",
            borderWidth: 1,
            borderColor: "#1f2937",
            shadowColor: "#000",
            shadowOpacity: 0.15,
            shadowRadius: 14,
            marginBottom: 16,
          }}
        >
          <View
            style={{
              position: "absolute",
              width: 200,
              height: 200,
              backgroundColor: "#0ea5e933",
              borderRadius: 200,
              top: -60,
              right: -60,
            }}
          />
          <View
            style={{
              position: "absolute",
              width: 160,
              height: 160,
              backgroundColor: "#22c55e22",
              borderRadius: 200,
              bottom: -50,
              left: -40,
            }}
          />
          <Text
            style={{
              color: "#a5f3fc",
              fontSize: 12,
              letterSpacing: 1,
              fontWeight: "700",
              textTransform: "uppercase",
            }}
          >
            Misiones
          </Text>
          <Text
            style={{
              color: "#e2e8f0",
              fontSize: 24,
              fontWeight: "800",
              marginTop: 6,
            }}
          >
            {story.title}
          </Text>
          <Text style={{ color: "#94a3b8", marginTop: 8, lineHeight: 20 }}>
            {story.summary}
          </Text>

          <View
            style={{
              marginTop: 16,
              backgroundColor: "#0b172b",
              borderColor: "#1f2937",
              borderWidth: 1,
              padding: 16,
              borderRadius: 16,
            }}
          >
            <Text style={{ color: "#cbd5e1", fontSize: 12, fontWeight: "700" }}>
              Progreso
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-end",
                marginTop: 6,
              }}
            >
              <Text
                style={{ color: "#e2e8f0", fontSize: 34, fontWeight: "900" }}
              >
                {totalMissions ? `${progressPct}%` : "--"}
              </Text>
              <Text
                style={{
                  color: "#94a3b8",
                  marginLeft: 8,
                  marginBottom: 6,
                  fontWeight: "600",
                }}
              >
                completadas
              </Text>
            </View>
            <View
              style={{
                marginTop: 10,
                height: 12,
                borderRadius: 999,
                backgroundColor: "#1f2937",
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  width: totalMissions ? `${progressPct}%` : "0%",
                  backgroundColor: "#22d3ee",
                  height: "100%",
                }}
              />
            </View>
            <View style={{ flexDirection: "row", marginTop: 12 }}>
              <View
                style={{
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: "#0f172a",
                  borderWidth: 1,
                  borderColor: "#1e293b",
                  flex: 1,
                  marginRight: 8,
                }}
              >
                <Text
                  style={{ color: "#a5f3fc", fontSize: 12, fontWeight: "700" }}
                >
                  Misiones
                </Text>
                <Text
                  style={{ color: "#e2e8f0", marginTop: 4, fontWeight: "800" }}
                >
                  {completedCount}/{totalMissions}
                </Text>
                <Text style={{ color: "#94a3b8", fontSize: 11, marginTop: 2 }}>
                  Completadas
                </Text>
              </View>
              <View
                style={{
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: "#0f172a",
                  borderWidth: 1,
                  borderColor: "#1e293b",
                  flex: 1,
                  marginLeft: 8,
                }}
              >
                <Text
                  style={{ color: "#a5f3fc", fontSize: 12, fontWeight: "700" }}
                >
                  Estado
                </Text>
                <Text
                  style={{ color: "#e2e8f0", marginTop: 4, fontWeight: "800" }}
                >
                  {storyDone
                    ? "Historia completa"
                    : nextIncompleteIndex >= 0
                      ? `Siguiente: ${nextIncompleteIndex + 1}`
                      : "En progreso"}
                </Text>
                <Text style={{ color: "#94a3b8", fontSize: 11, marginTop: 2 }}>
                  Ruta narrativa
                </Text>
              </View>
            </View>
            {storyDone ? (
              <Text
                style={{ marginTop: 10, color: "#22c55e", fontWeight: "700" }}
              >
                ¡Historia completada!
              </Text>
            ) : nextIncompleteIndex >= 0 ? (
              <Pressable
                onPress={() => handleMissionPress(nextIncompleteIndex)}
                style={({ pressed }) => ({
                  marginTop: 12,
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: "center",
                  backgroundColor: pressed ? "#1d4ed8" : "#2563eb",
                  shadowColor: "#2563eb",
                  shadowOpacity: 0.25,
                  shadowRadius: 10,
                })}
              >
                <Text style={{ color: "white", fontWeight: "800" }}>
                  Continuar misión {nextIncompleteIndex + 1}
                </Text>
                <Text style={{ color: "#e0f2fe", fontSize: 12, marginTop: 2 }}>
                  Sigue la historia
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <Text
          style={{
            color: "#e2e8f0",
            fontWeight: "800",
            fontSize: 16,
            marginBottom: 10,
          }}
        >
          Misiones ({story.missions.length})
        </Text>

        {story.missions.map((mission, index) => {
          const missionDone = isMissionCompleted(
            story.storyId,
            mission.missionId,
          );
          return (
            <Pressable
              key={mission.missionId}
              onPress={() => handleMissionPress(index)}
              style={({ pressed }) => ({
                marginBottom: 12,
                borderRadius: 16,
                backgroundColor: "#0f172a",
                borderWidth: 1,
                borderColor: "#1f2937",
                padding: 16,
                shadowColor: "#000",
                shadowOpacity: 0.12,
                shadowRadius: 10,
                opacity: pressed ? 0.96 : 1,
              })}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "800",
                    color: "#e2e8f0",
                    flex: 1,
                  }}
                >
                  {index + 1}. {mission.title}
                </Text>
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: missionDone ? "#22c55e" : "#22d3ee",
                    backgroundColor: missionDone
                      ? "rgba(34, 197, 94, 0.14)"
                      : "rgba(34, 211, 238, 0.14)",
                    marginLeft: 10,
                  }}
                >
                  <Text
                    style={{
                      color: "#e2e8f0",
                      fontWeight: "700",
                      fontSize: 12,
                    }}
                  >
                    {missionDone ? "Completada" : "Pendiente"}
                  </Text>
                </View>
              </View>
              {mission.sceneSummary ? (
                <Text style={{ marginTop: 6, color: "#94a3b8" }}>
                  {mission.sceneSummary}
                </Text>
              ) : null}
              <View
                style={{
                  marginTop: 10,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: "#22d3ee",
                    backgroundColor: "#0b172b",
                    borderWidth: 1,
                    borderColor: "#1f2937",
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 999,
                  }}
                >
                  {mission.requirements.length}{" "}
                  {mission.requirements.length === 1
                    ? "requisito"
                    : "requisitos"}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
